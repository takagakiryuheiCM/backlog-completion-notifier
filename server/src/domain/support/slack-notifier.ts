import type { SlackMessage } from "../template/slack/types.js";

/**
 * postMessage の結果
 */
export interface PostMessageResult {
  channel: string;
  ts: string;
}

/**
 * Slack 通知 インターフェース
 */
export interface SlackNotifier {
  postMessage(message: SlackMessage): Promise<PostMessageResult>;
}
