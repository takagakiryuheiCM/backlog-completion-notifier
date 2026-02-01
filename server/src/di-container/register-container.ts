import { LambdaClient } from "@aws-sdk/client-lambda";
import { Container } from "inversify";
import { unwrapEnv } from "./env-util.js";
import * as serviceId from "./service-id.js";
import type { BacklogRepository } from "../domain/model/backlog/backlog-repository.js";
import type { SlackNotifier } from "../domain/support/slack-notifier.js";
import type { SummaryGenerator } from "../domain/support/summary-generator.js";
import type { DurableFunctionClient } from "../domain/support/durable-function-client.js";
import type { Logger } from "../domain/support/logger/index.js";
import type { FetchNow } from "../domain/support/fetch-now/index.js";
import { BacklogClient } from "../infrastructure/backlog-client.js";
import { SlackClient } from "../infrastructure/slack-client.js";
import { BedrockClient } from "../infrastructure/bedrock-client.js";
import { LambdaDurableFunctionClient } from "../infrastructure/lambda-durable-function-client.js";
import { LoggerImpl, type LogLevel } from "../infrastructure/logger/index.js";
import { buildFetchNow } from "../infrastructure/fetch-now/index.js";
import { HandleBacklogWebhookUseCaseImpl } from "../use-case/handle-backlog-webhook/handle-backlog-webhook-use-case.js";
import { HandleSlackWebhookUseCaseImpl } from "../use-case/handle-slack-webhook/handle-slack-webhook-use-case.js";
import { ProcessIssueCompletionUseCaseImpl } from "../use-case/process-issue-completion/process-issue-completion-use-case.js";
import { buildErrorResponse } from "../presenter/error-response-builder.js";

/**
 * DIコンテナに値を登録し、そのDIコンテナを返す
 */
export const registerContainer = (): Container => {
  const container = new Container();

  /**
   * 環境変数
   */
  container
    .bind(serviceId.BACKLOG_SPACE_ID)
    .toDynamicValue(() => unwrapEnv("BACKLOG_SPACE_ID"))
    .inSingletonScope();
  container
    .bind(serviceId.BACKLOG_API_KEY)
    .toDynamicValue(() => unwrapEnv("BACKLOG_API_KEY"))
    .inSingletonScope();
  container
    .bind(serviceId.SLACK_BOT_TOKEN)
    .toDynamicValue(() => unwrapEnv("SLACK_BOT_TOKEN"))
    .inSingletonScope();
  container
    .bind(serviceId.SLACK_CHANNEL_ID)
    .toDynamicValue(() => unwrapEnv("SLACK_CHANNEL_ID"))
    .inSingletonScope();
  container
    .bind(serviceId.DURABLE_FUNCTION_NAME)
    .toDynamicValue(() => unwrapEnv("DURABLE_FUNCTION_NAME"))
    .inSingletonScope();
  container
    .bind(serviceId.LOG_LEVEL)
    .toDynamicValue(() => unwrapEnv("LOG_LEVEL", "DEBUG"))
    .inSingletonScope();

  /**
   * ユーティリティ
   */
  container
    .bind<Logger>(serviceId.LOGGER)
    .toDynamicValue(() =>
      new LoggerImpl({
        logLevel: container.get<string>(serviceId.LOG_LEVEL) as LogLevel,
        serviceName: "backlog-completion-notifier",
      })
    )
    .inSingletonScope();
  container
    .bind<FetchNow>(serviceId.FETCH_NOW)
    .toDynamicValue(() => buildFetchNow())
    .inSingletonScope();

  /**
   * AWS SDK
   */
  container
    .bind(serviceId.LAMBDA_CLIENT)
    .toDynamicValue(() => new LambdaClient({ region: "ap-northeast-1" }))
    .inSingletonScope();

  /**
   * インフラストラクチャ
   */
  container
    .bind<BacklogRepository>(serviceId.BACKLOG_REPOSITORY)
    .toDynamicValue(() =>
      new BacklogClient(
        container.get<string>(serviceId.BACKLOG_SPACE_ID),
        container.get<string>(serviceId.BACKLOG_API_KEY)
      )
    )
    .inSingletonScope();

  container
    .bind<SlackNotifier>(serviceId.SLACK_NOTIFIER)
    .toDynamicValue(() =>
      new SlackClient(container.get<string>(serviceId.SLACK_BOT_TOKEN))
    )
    .inSingletonScope();

  container
    .bind<SummaryGenerator>(serviceId.SUMMARY_GENERATOR)
    .toDynamicValue(() => new BedrockClient(
      container.get<Logger>(serviceId.LOGGER)

    ))
    .inSingletonScope();

  container
    .bind<DurableFunctionClient>(serviceId.DURABLE_FUNCTION_CLIENT)
    .toDynamicValue(() =>
      new LambdaDurableFunctionClient(
        container.get<LambdaClient>(serviceId.LAMBDA_CLIENT),
        container.get<string>(serviceId.DURABLE_FUNCTION_NAME)
      )
    )
    .inSingletonScope();

  /**
   * ユースケース
   */
  container.bind(serviceId.HANDLE_BACKLOG_WEBHOOK_USE_CASE).toDynamicValue(
    () =>
      new HandleBacklogWebhookUseCaseImpl({
        durableFunctionClient: container.get<DurableFunctionClient>(
          serviceId.DURABLE_FUNCTION_CLIENT
        ),
        logger: container.get<Logger>(serviceId.LOGGER),
      })
  );

  container.bind(serviceId.HANDLE_SLACK_WEBHOOK_USE_CASE).toDynamicValue(
    () =>
      new HandleSlackWebhookUseCaseImpl({
        durableFunctionClient: container.get<DurableFunctionClient>(
          serviceId.DURABLE_FUNCTION_CLIENT
        ),
        logger: container.get<Logger>(serviceId.LOGGER),
        fetchNow: container.get<FetchNow>(serviceId.FETCH_NOW),
      })
  );

  container.bind(serviceId.PROCESS_ISSUE_COMPLETION_USE_CASE).toDynamicValue(
    () =>
      new ProcessIssueCompletionUseCaseImpl({
        backlogRepository: container.get<BacklogRepository>(
          serviceId.BACKLOG_REPOSITORY
        ),
        slackNotifier: container.get<SlackNotifier>(serviceId.SLACK_NOTIFIER),
        summaryGenerator: container.get<SummaryGenerator>(
          serviceId.SUMMARY_GENERATOR
        ),
        slackChannelId: container.get<string>(serviceId.SLACK_CHANNEL_ID),
        logger: container.get<Logger>(serviceId.LOGGER),
      })
  );

  /**
   * プレゼンター
   */
  container
    .bind(serviceId.ERROR_RESPONSE_BUILDER)
    .toDynamicValue(() => buildErrorResponse)
    .inSingletonScope();

  return container;
};
