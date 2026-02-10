import type { DurableContext } from "@aws/durable-execution-sdk-js";
import type { BacklogRepository } from "../../domain/model/backlog/backlog-repository.js";
import type { SlackNotifier } from "../../domain/support/slack-notifier.js";
import type { SummaryGenerator } from "../../domain/support/summary-generator.js";
import type { Logger } from "../../domain/support/logger/index.js";
import { buildCompletionSummaryPrompt } from "../../domain/template/prompt/completion-summary-prompt.js";
import { buildApprovalMessage } from "../../domain/template/slack/approval-message.js";
import { buildCompletionMessage } from "../../domain/template/slack/completion-message.js";
import { buildBacklogComment } from "../../domain/template/backlog/comment.js";

/**
 * 課題完了処理ユースケースの入力
 */
export interface ProcessIssueCompletionInput {
  issueKey: string;
}

/**
 * 課題完了処理ユースケースの出力
 */
export interface ProcessIssueCompletionOutput {
  issueKey: string;
  status: "completed" | "rejected";
  approved?: boolean;
  summary: string;
}

/**
 * 課題完了処理ユースケースのプロパティ
 */
export interface ProcessIssueCompletionUseCaseProps {
  backlogRepository: BacklogRepository;
  slackNotifier: SlackNotifier;
  summaryGenerator: SummaryGenerator;
  slackChannelId: string;
  logger: Logger;
}

/**
 * コールバック結果の型定義
 */
interface CallbackResult {
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

/**
 * 課題完了処理ユースケース型
 * NOTE: DurableContextを引数に取るため、標準のUseCase型とは異なる
 */
export type ProcessIssueCompletionUseCase = {
  execute(
    input: ProcessIssueCompletionInput,
    context: DurableContext
  ): Promise<ProcessIssueCompletionOutput>;
};

/**
 * 課題完了処理ユースケース実装
 * Durable Functionのワークフローを管理
 *
 * NOTE: DurableContextを受け取るため技術的詳細に依存しているが、
 * step()やcreateCallback()によるチェックポイント機能が
 * ワークフローの耐久性に必須であり、これを抽象化すると
 * 過度に複雑になるためトレードオフとして許容している
 */
export class ProcessIssueCompletionUseCaseImpl implements ProcessIssueCompletionUseCase {
  readonly #backlogRepository: BacklogRepository;
  readonly #slackNotifier: SlackNotifier;
  readonly #summaryGenerator: SummaryGenerator;
  readonly #slackChannelId: string;
  readonly #logger: Logger;

  constructor(props: ProcessIssueCompletionUseCaseProps) {
    this.#backlogRepository = props.backlogRepository;
    this.#slackNotifier = props.slackNotifier;
    this.#summaryGenerator = props.summaryGenerator;
    this.#slackChannelId = props.slackChannelId;
    this.#logger = props.logger;
  }

  async execute(
    input: ProcessIssueCompletionInput,
    context: DurableContext
  ): Promise<ProcessIssueCompletionOutput> {
    const { issueKey } = input;

    this.#logger.debug("課題完了処理開始", {
      useCase: "process-issue-completion",
      issueKey,
      slackChannelId: this.#slackChannelId,
    });

    // Step 1: 課題詳細とコメントを取得
    this.#logger.debug("Step 1: 課題詳細・コメント取得開始", { issueKey });
    const issueDetails = await context.step("fetch-issue-details", async () => {
      const [issue, comments] = await Promise.all([
        this.#backlogRepository.getIssue(issueKey),
        this.#backlogRepository.getComments(issueKey),
      ]);
      const issueUrl = this.#backlogRepository.getIssueUrl(issueKey);
      return {
        issueKey,
        issueSummary: issue.summary,
        issueDescription: issue.description,
        issueUrl,
        comments: comments.map((c) => ({
          userName: c.createdUser.name,
          content: c.content,
          created: c.created,
        })),
      };
    });
    this.#logger.debug("Step 1: 課題詳細・コメント取得完了", {
      issueKey,
      commentCount: issueDetails.comments.length,
    });

    // Step 2: 完了サマリーを生成
    this.#logger.debug("Step 2: サマリー生成開始");
    const summary = await context.step("generate-summary", async () => {
      const prompt = buildCompletionSummaryPrompt({
        issueKey: issueDetails.issueKey,
        issueSummary: issueDetails.issueSummary,
        issueDescription: issueDetails.issueDescription,
        comments: issueDetails.comments,
      });
      return this.#summaryGenerator.generate(prompt);
    });
    this.#logger.debug("Step 2: サマリー生成完了");

    // Step 3: コールバックを作成
    this.#logger.debug("Step 3: コールバック作成開始");
    const [callbackPromise, callbackId] = await context.createCallback("approval", {
      timeout: { hours: 24 },
    });
    this.#logger.debug("Step 3: コールバック作成完了", { callbackId });

    // Step 4: Slack承認リクエストを送信
    this.#logger.debug("Step 4: Slack承認リクエスト送信開始", {
      channel: this.#slackChannelId,
      issueKey: issueDetails.issueKey,
      callbackId,
    });
    const approvalMessageResult = await context.step("send-approval-request", async () => {
      const message = buildApprovalMessage({
        channel: this.#slackChannelId,
        issueKey: issueDetails.issueKey,
        issueSummary: issueDetails.issueSummary,
        issueUrl: issueDetails.issueUrl,
        callbackId,
      });
      return this.#slackNotifier.postMessage(message);
    });
    this.#logger.debug("Step 4: Slack承認リクエスト送信完了", {
      channel: approvalMessageResult.channel,
      ts: approvalMessageResult.ts,
    });

    // Step 4.5: 完了サマリーをスレッドに投稿
    this.#logger.debug("Step 4.5: サマリースレッド投稿開始");
    await context.step("send-summary-thread", async () => {
      await this.#slackNotifier.postMessage({
        channel: this.#slackChannelId,
        text: `*完了サマリー:*\n${summary}`,
        thread_ts: approvalMessageResult.ts,
      });
    });
    this.#logger.debug("Step 4.5: サマリースレッド投稿完了");

    // Step 5: ユーザー承認を待機
    this.#logger.debug("承認待機中", {
      useCase: "process-issue-completion",
      issueKey,
      callbackId,
    });

    let approval: CallbackResult;

    try {
      const result = await callbackPromise;
      approval = JSON.parse(result) as CallbackResult;
      this.#logger.debug("承認結果受信", {
        useCase: "process-issue-completion",
        approval,
      });
    } catch {
      this.#logger.debug("承認却下またはタイムアウト", {
        useCase: "process-issue-completion",
        issueKey,
      });

      await context.step("send-rejection-notification", async () => {
        const message = buildCompletionMessage({
          channel: this.#slackChannelId,
          issueKey,
          approved: false,
        });
        await this.#slackNotifier.postMessage(message);
      });

      return { issueKey, status: "rejected", summary };
    }

    // Step 6: 承認時の処理
    if (approval.approved) {
      this.#logger.debug("承認後処理開始", {
        useCase: "process-issue-completion",
        issueKey,
      });

      await context.step("post-backlog-comment", async () => {
        const comment = buildBacklogComment({ summary });
        await this.#backlogRepository.addComment(issueKey, comment);
      });

      await context.step("send-completion-notification", async () => {
        const message = buildCompletionMessage({
          channel: this.#slackChannelId,
          issueKey,
          approved: true,
        });
        await this.#slackNotifier.postMessage(message);
      });

      this.#logger.debug("承認後処理完了", {
        useCase: "process-issue-completion",
        issueKey,
      });
    }

    this.#logger.debug("課題完了処理終了", {
      useCase: "process-issue-completion",
      issueKey,
      status: "completed",
      approved: approval.approved,
    });

    return { issueKey, status: "completed", approved: approval.approved, summary };
  }
}
