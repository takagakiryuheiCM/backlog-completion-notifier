import { zValidator } from "@hono/zod-validator";
import { createFactory } from "hono/factory";
import type { Container } from "inversify";
import {
  BacklogWebhookRequestSchema,
  toBacklogWebhookEvent,
} from "../../schema/backlog-webhook-schema.js";
import type { HandleBacklogWebhookUseCase } from "../../../../use-case/handle-backlog-webhook/handle-backlog-webhook-use-case.js";
import * as serviceId from "../../../../di-container/service-id.js";
import type { Logger } from "../../../../domain/support/logger/index.js";

const factory = createFactory();

/**
 * Backlog Webhook受信ハンドラー
 */
export const buildBacklogWebhookHandler = ({
  container,
}: {
  container: Container;
}) => {
  return factory.createHandlers(
    zValidator("json", BacklogWebhookRequestSchema),
    async (c) => {
      const rawRequest = c.req.valid("json");
      const logger = container.get<Logger>(serviceId.LOGGER);

      logger.info("Backlog Webhook処理開始", {
        useCase: "backlog-webhook-handler",
        rawRequest,
      });

      // スキーマからドメイン型へ変換
      const event = toBacklogWebhookEvent(rawRequest);

      const useCase = container.get<HandleBacklogWebhookUseCase>(
        serviceId.HANDLE_BACKLOG_WEBHOOK_USE_CASE
      );
      const result = await useCase.execute(event);

      logger.info("Backlog Webhook処理完了", {
        useCase: "backlog-webhook-handler",
        result,
      });

      return c.json({ message: result.status, ...result });
    }
  );
};
