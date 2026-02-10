import type { SlackMessage } from "../domain/template/slack/types.js";
import type { SlackNotifier, PostMessageResult } from "../domain/support/slack-notifier.js";
import type { Logger } from "../domain/support/logger/index.js";

/**
 * Slack API クライアント
 */
export class SlackClient implements SlackNotifier {
  readonly #botToken: string;
  readonly #baseUrl = "https://slack.com/api";
  readonly #logger: Logger;

  constructor(botToken: string, logger: Logger) {
    this.#botToken = botToken;
    this.#logger = logger;
  }

  /**
   * メッセージを送信
   */
  async postMessage(message: SlackMessage): Promise<PostMessageResult> {
    this.#logger.debug("[SlackClient] postMessage開始", {
      channel: message.channel,
      hasBlocks: !!message.blocks,
      blocksCount: message.blocks?.length ?? 0,
    });

    let response: Response;
    try {
      response = await fetch(`${this.#baseUrl}/chat.postMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.#botToken}`,
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      this.#logger.error("[SlackClient] fetch失敗", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    this.#logger.debug("[SlackClient] fetchレスポンス受信", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorMessage = `Failed to post message: ${response.statusText}`;
      this.#logger.error("[SlackClient] HTTPエラー", { errorMessage });
      throw new Error(errorMessage);
    }

    const result = (await response.json()) as SlackPostMessageResponse;

    this.#logger.debug("[SlackClient] Slack APIレスポンス", {
      ok: result.ok,
      error: result.error,
      channel: result.channel,
      ts: result.ts,
    });

    if (!result.ok) {
      const errorMessage = `Slack API error: ${result.error}`;
      this.#logger.error("[SlackClient] Slack APIエラー", { errorMessage });
      throw new Error(errorMessage);
    }

    this.#logger.debug("[SlackClient] postMessage完了");

    return {
      channel: result.channel!,
      ts: result.ts!,
    };
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
