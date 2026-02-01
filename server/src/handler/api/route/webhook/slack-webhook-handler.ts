import { createFactory } from "hono/factory";
import type { Container } from "inversify";
import { SlackWebhookRequestSchema, type SlackWebhookRequest } from "../../schema/slack-webhook-schema.js";
import { slackPayloadValidator, getValidSlackPayload } from "../../middleware/slack-payload-validator.js";
import type { HandleSlackWebhookUseCase } from "../../../../use-case/handle-slack-webhook/handle-slack-webhook-use-case.js";
import * as serviceId from "../../../../di-container/service-id.js";
import type { Logger } from "../../../../domain/support/logger/index.js";

const factory = createFactory();

/**
 * Slack Interactive Messages受信ハンドラー
 */
export const buildSlackWebhookHandler = ({
  container,
}: {
  container: Container;
}) => {
  return factory.createHandlers(
    slackPayloadValidator(SlackWebhookRequestSchema),
    async (c) => {
      const payload = getValidSlackPayload<SlackWebhookRequest>(c);
      const { callbackId, approved } = payload.actions[0]!.value;
      const userName = payload.user.name;

      const logger = container.get<Logger>(serviceId.LOGGER);
      logger.info("Slack Webhook処理開始", {
        useCase: "slack-webhook-handler",
        callbackId,
        approved,
        userName,
      });
      const useCase = container.get<HandleSlackWebhookUseCase>(
        serviceId.HANDLE_SLACK_WEBHOOK_USE_CASE
      );
      const result = await useCase.execute({ callbackId, approved, userName });
      logger.info("Slack Webhook処理完了", {
        useCase: "slack-webhook-handler",
        callbackId,
        approved,
        userName,
      });
      return c.json(result);
    }
  );
};
