import type { SlackMessage } from "../domain/template/slack/types.js";
import type { SlackNotifier } from "../domain/support/slack-notifier.js";

/**
 * Slack API クライアント
 */
export class SlackClient implements SlackNotifier {
  readonly #botToken: string;
  readonly #baseUrl = "https://slack.com/api";

  constructor(botToken: string) {
    this.#botToken = botToken;
  }

  /**
   * メッセージを送信
   */
  async postMessage(message: SlackMessage): Promise<void> {
    const response = await fetch(`${this.#baseUrl}/chat.postMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.#botToken}`,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Failed to post message: ${response.statusText}`);
    }

    const result = (await response.json()) as SlackPostMessageResponse;

    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }
  }

  /**
   * メッセージを更新
   */
  async updateMessage(
    channel: string,
    ts: string,
    message: Partial<SlackMessage>
  ): Promise<SlackUpdateMessageResponse> {
    const response = await fetch(`${this.#baseUrl}/chat.update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.#botToken}`,
      },
      body: JSON.stringify({
        channel,
        ts,
        ...message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update message: ${response.statusText}`);
    }

    const result = (await response.json()) as SlackUpdateMessageResponse;

    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    return result;
  }
}

/**
 * Slack API レスポンスの型定義
 */
export interface SlackPostMessageResponse {
  ok: boolean;
  channel?: string;
  ts?: string;
  message?: {
    text: string;
  };
  error?: string;
}

export interface SlackUpdateMessageResponse {
  ok: boolean;
  channel?: string;
  ts?: string;
  error?: string;
}
