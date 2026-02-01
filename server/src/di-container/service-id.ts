/**
 * 環境変数
 */
export const BACKLOG_SPACE_ID = "BACKLOG_SPACE_ID" as const;
export const BACKLOG_API_KEY = "BACKLOG_API_KEY" as const;
export const SLACK_BOT_TOKEN = "SLACK_BOT_TOKEN" as const;
export const SLACK_CHANNEL_ID = "SLACK_CHANNEL_ID" as const;
export const DURABLE_FUNCTION_NAME = "DURABLE_FUNCTION_NAME" as const;
export const LOG_LEVEL = "LOG_LEVEL" as const;

/**
 * ユーティリティ
 */
export const LOGGER = "LOGGER" as const;
export const FETCH_NOW = "FETCH_NOW" as const;

/**
 * インフラストラクチャ
 */
export const BACKLOG_REPOSITORY = "BACKLOG_REPOSITORY" as const;
export const SLACK_NOTIFIER = "SLACK_NOTIFIER" as const;
export const SUMMARY_GENERATOR = "SUMMARY_GENERATOR" as const;
export const DURABLE_FUNCTION_CLIENT = "DURABLE_FUNCTION_CLIENT" as const;
export const LAMBDA_CLIENT = "LAMBDA_CLIENT" as const;

/**
 * ユースケース
 */
export const HANDLE_BACKLOG_WEBHOOK_USE_CASE = "HANDLE_BACKLOG_WEBHOOK_USE_CASE" as const;
export const HANDLE_SLACK_WEBHOOK_USE_CASE = "HANDLE_SLACK_WEBHOOK_USE_CASE" as const;
export const PROCESS_ISSUE_COMPLETION_USE_CASE = "PROCESS_ISSUE_COMPLETION_USE_CASE" as const;

/**
 * プレゼンター
 */
export const ERROR_RESPONSE_BUILDER = "ERROR_RESPONSE_BUILDER" as const;
