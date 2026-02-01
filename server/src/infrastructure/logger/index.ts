import { Logger as PowerToolsLogger } from "@aws-lambda-powertools/logger";
import type { Logger, AdditionalData } from "../../domain/support/logger/index.js";

/**
 * ログレベル
 */
export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

/**
 * Logger 実装（AWS Lambda Powertools使用）
 */
export type LoggerImplProps = {
  logLevel?: LogLevel;
  serviceName: string;
};

export class LoggerImpl implements Logger {
  readonly #logger: PowerToolsLogger;

  constructor({ logLevel = "DEBUG", serviceName }: LoggerImplProps) {
    this.#logger = new PowerToolsLogger({
      logLevel,
      serviceName,
    });
  }

  debug(message: string, data?: AdditionalData): void {
    this.#logger.debug(message, { data });
  }

  info(message: string, data?: AdditionalData): void {
    this.#logger.info(message, { data });
  }

  warn(message: string, data?: AdditionalData): void {
    this.#logger.warn(message, { data });
  }

  error(message: string, data?: AdditionalData): void {
    this.#logger.error(message, { data });
  }

  appendKeys(params: { [key: string]: unknown }): void {
    this.#logger.appendKeys({ ...params });
  }

  removeKeys(keys: string[]): void {
    this.#logger.removeKeys(keys);
  }
}