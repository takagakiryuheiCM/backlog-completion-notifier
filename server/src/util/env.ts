/**
 * 環境変数を取得するユーティリティ
 */
export const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};

export const getEnvOrDefault = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

/**
 * 環境変数の型定義
 */
export interface Env {
  STAGE_NAME: string;
  BACKLOG_API_KEY: string;
  BACKLOG_SPACE_ID: string;
  SLACK_BOT_TOKEN: string;
  SLACK_CHANNEL_ID: string;
  DURABLE_FUNCTION_NAME: string;
}
