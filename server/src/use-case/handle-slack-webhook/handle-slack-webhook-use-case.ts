import type { UseCase } from "../interfaces.js";
import type { DurableFunctionClient } from "../../domain/support/durable-function-client.js";
import type { Logger } from "../../domain/support/logger/index.js";
import type { FetchNow } from "../../domain/support/fetch-now/index.js";
import {
  buildApprovalResponse,
  type SlackInteractiveResponse,
} from "../../domain/template/slack/interactive-response.js";

/**
 * Slack Webhook処理ユースケースの入力
 */
export interface HandleSlackWebhookInput {
  callbackId: string;
  approved: boolean;
  userName: string;
}

/**
 * Slack Webhook処理ユースケースの出力
 */
export type HandleSlackWebhookOutput = SlackInteractiveResponse;

/**
 * Slack Webhook処理ユースケースのプロパティ
 */
export interface HandleSlackWebhookUseCaseProps {
  durableFunctionClient: DurableFunctionClient;
  logger: Logger;
  fetchNow: FetchNow;
}

/**
 * Slack Webhook処理ユースケース型
 */
export type HandleSlackWebhookUseCase = UseCase<
  HandleSlackWebhookInput,
  HandleSlackWebhookOutput
>;

/**
 * Slack Webhook処理ユースケース実装
 * SlackのInteractive Messagesを処理し、Durable Functionのコールバックを送信
 */
export class HandleSlackWebhookUseCaseImpl implements HandleSlackWebhookUseCase {
  readonly #durableFunctionClient: DurableFunctionClient;
  readonly #logger: Logger;
  readonly #fetchNow: FetchNow;

  constructor({ durableFunctionClient, logger, fetchNow }: HandleSlackWebhookUseCaseProps) {
    this.#durableFunctionClient = durableFunctionClient;
    this.#logger = logger;
    this.#fetchNow = fetchNow;
  }

  async execute(input: HandleSlackWebhookInput): Promise<HandleSlackWebhookOutput> {
    const { callbackId, approved, userName } = input;

    this.#logger.debug("Slack Webhook処理開始", {
      useCase: "handle-slack-webhook",
      callbackId,
      approved,
      userName,
    });

    if (approved) {
      this.#logger.info("承認処理実行", {
        useCase: "handle-slack-webhook",
        callbackId,
        userName,
      });

      await this.#durableFunctionClient.sendCallbackSuccess(callbackId, {
        approved: true,
        approvedBy: userName,
        approvedAt: this.#fetchNow().toISOString(),
      });
    } else {
      this.#logger.info("却下処理実行", {
        useCase: "handle-slack-webhook",
        callbackId,
        userName,
      });

      await this.#durableFunctionClient.sendCallbackFailure(callbackId, {
        rejectedBy: userName,
      });
    }

    this.#logger.debug("Slack Webhook処理完了", {
      useCase: "handle-slack-webhook",
      callbackId,
      approved,
    });

    return buildApprovalResponse({ approved, userName });
  }
}
