import {
  withDurableExecution,
  DurableContext,
} from "@aws/durable-execution-sdk-js";
import { registerContainer } from "../../di-container/register-container.js";
import * as serviceId from "../../di-container/service-id.js";
import type { ProcessIssueCompletionUseCase } from "../../use-case/process-issue-completion/process-issue-completion-use-case.js";
import type { Logger } from "../../domain/support/logger/index.js";

/**
 * Durable Function入力の型定義
 */
interface DurableFunctionInput {
  issueKey: string;
  projectKey: string;
  issueSummary: string;
  issueDescription: string;
}

// コンテナを初期化（Lambda起動時に1回のみ）
const container = registerContainer();

/**
 * Durable Function Handler
 * 課題完了の通知と承認フローを管理
 */
export const handler = withDurableExecution(
  async (event: DurableFunctionInput, context: DurableContext) => {
    const logger = container.get<Logger>(serviceId.LOGGER);
    logger.info("Durable Function Handler開始", {
      useCase: "durable-function-handler",
      event: JSON.stringify(event, null, 2),
    });

    const useCase = container.get<ProcessIssueCompletionUseCase>(
      serviceId.PROCESS_ISSUE_COMPLETION_USE_CASE
    );
    
    logger.info("Durable Function Handler完了", {
      useCase: "durable-function-handler",
    });
    return useCase.execute({ issueKey: event.issueKey }, context);
  }
);
