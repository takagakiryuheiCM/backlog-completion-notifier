import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { SummaryGenerator } from "../domain/support/summary-generator.js";
import type { Logger } from "../domain/support/logger/index.js";

/**
 * Amazon Bedrock クライアント
 * Claude モデルを使用してAI生成を行う
 */
export class BedrockClient implements SummaryGenerator {
  readonly #client: BedrockRuntimeClient;
  readonly #modelId: string;
  readonly #logger: Logger;
  constructor(logger: Logger) {
    this.#client = new BedrockRuntimeClient({ region: "ap-northeast-1" });
    // Claude Opus 4.5 - Marketplace subscription required
    this.#modelId = "global.anthropic.claude-opus-4-5-20251101-v1:0";
    this.#logger = logger;
    }

  /**
   * プロンプトを送信してAI生成結果を取得
   */
  async generate(prompt: string): Promise<string> {
    this.#logger.info(`[BedrockClient] Calling model: ${this.#modelId}`);

    const command = new InvokeModelCommand({
      modelId: this.#modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    try {
      const response = await this.#client.send(command);

      if (!response.body) {
        throw new Error("Empty response from Bedrock");
      }

      const responseBody = JSON.parse(
        new TextDecoder().decode(response.body)
      ) as BedrockResponse;

      const content = responseBody.content[0];
      if (!content) {
        throw new Error("No content in Bedrock response");
      }

      console.info(`[BedrockClient] Success, tokens: ${responseBody.usage.input_tokens}/${responseBody.usage.output_tokens}`);
      return content.text;
    } catch (error) {
      console.error(`[BedrockClient] Error:`, error);
      throw error;
    }
  }
}

/**
 * Bedrock Claude レスポンスの型定義
 */
interface BedrockResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
