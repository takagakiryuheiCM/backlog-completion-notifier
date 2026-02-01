/**
 * アプリケーション設定の型定義
 */
export type Config = {
  /**
   * Backlog設定
   */
  backlogSpaceId: string; // BacklogのスペースID（例: "your-space"）

  /**
   * Slack設定
   */
  slackChannelId: string; // 通知先のSlackチャンネルID
};
