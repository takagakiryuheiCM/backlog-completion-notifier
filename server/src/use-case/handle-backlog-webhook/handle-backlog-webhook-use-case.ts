import type { UseCase } from "../interfaces.js";
import type { DurableFunctionClient } from "../../domain/support/durable-function-client.js";
import type { Logger } from "../../domain/support/logger/index.js";
import {
  type BacklogWebhookEvent,
  BacklogEventType,
  isIssueCompleted,
  getIssueKey,
} from "../../domain/model/backlog/backlog-event.js";

/**
 * Backlog Webhook処理ユースケースの入力
 */
export type HandleBacklogWebhookInput = BacklogWebhookEvent;

/**
 * Backlog Webhook処理ユースケースの出力
 */
export interface HandleBacklogWebhookOutput {
  status: "invoked" | "ignored";
  reason?: string;
  issueKey?: string;
}

/**
 * Backlog Webhook処理ユースケースのプロパティ
 */
export interface HandleBacklogWebhookUseCaseProps {
  durableFunctionClient: DurableFunctionClient;
  logger: Logger;
}

/**
 * Backlog Webhook処理ユースケース型
 */
export type HandleBacklogWebhookUseCase = UseCase<
  HandleBacklogWebhookInput,
  HandleBacklogWebhookOutput
>;

/**
 * Backlog Webhook処理ユースケース実装
 * Webhookイベントを判定し、必要に応じてDurable Functionを起動
 */
export class HandleBacklogWebhookUseCaseImpl implements HandleBacklogWebhookUseCase {
  readonly #durableFunctionClient: DurableFunctionClient;
  readonly #logger: Logger;

  constructor({ durableFunctionClient, logger }: HandleBacklogWebhookUseCaseProps) {
    this.#durableFunctionClient = durableFunctionClient;
    this.#logger = logger;
  }

  async execute(input: HandleBacklogWebhookInput): Promise<HandleBacklogWebhookOutput> {
    this.#logger.debug("Backlog Webhook処理開始", {
      useCase: "handle-backlog-webhook",
      eventType: input.type,
    });

    // 課題更新イベント以外は無視
    if (input.type !== BacklogEventType.ISSUE_UPDATED) {
      this.#logger.debug("課題更新イベント以外のため無視", {
        useCase: "handle-backlog-webhook",
        eventType: input.type,
      });
      return {
        status: "ignored",
        reason: "Not an issue update event",
      };
    }

    // 課題が完了状態でなければ無視
    if (!isIssueCompleted(input)) {
      this.#logger.debug("課題が完了状態でないため無視", {
        useCase: "handle-backlog-webhook",
      });
      return {
        status: "ignored",
        reason: "Issue is not completed",
      };
    }

    const issueKey = getIssueKey(input);

    this.#logger.debug("Durable Function起動", {
      useCase: "handle-backlog-webhook",
      issueKey,
    });

    // Durable Functionを起動
    await this.#durableFunctionClient.invoke({
      issueKey,
      projectKey: input.project.projectKey,
      issueSummary: input.issue.summary,
      issueDescription: input.issue.description || "",
    });

    this.#logger.debug("Backlog Webhook処理完了", {
      useCase: "handle-backlog-webhook",
      issueKey,
    });

    return {
      status: "invoked",
      issueKey,
    };
  }
}
