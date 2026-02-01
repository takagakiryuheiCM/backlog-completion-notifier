import { Hono } from "hono";
import type { Container } from "inversify";
import { buildBacklogWebhookHandler } from "./backlog-webhook-handler.js";
import { buildSlackWebhookHandler } from "./slack-webhook-handler.js";

/**
 * Webhookルーター
 */
export const buildWebhookRouter = ({
  container,
}: {
  container: Container;
}): Hono => {
  const router = new Hono();

  // Backlog Webhook: Zod Validatorでバリデーション
  router.post("/backlog", ...buildBacklogWebhookHandler({ container }));

  // Slack Webhook: form-urlencodedのためハンドラー内でバリデーション
  router.post("/slack", ...buildSlackWebhookHandler({ container }));

  return router;
};
