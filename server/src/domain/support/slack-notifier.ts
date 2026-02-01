import type { SlackMessage } from "../template/slack/types.js";

/**
 * Slack 通知 インターフェース
 */
export interface SlackNotifier {
  postMessage(message: SlackMessage): Promise<void>;
}
