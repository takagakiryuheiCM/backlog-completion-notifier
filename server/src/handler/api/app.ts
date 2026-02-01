import { Hono } from "hono";
import type { Container } from "inversify";
import { buildWebhookRouter } from "./route/webhook/webhook-router.js";
import { buildErrorResponse } from "../../presenter/error-response-builder.js";

/**
 * Honoアプリケーションを構築
 */
export const buildApp = ({ container }: { container: Container }): Hono => {
  const app = new Hono();

  // リクエストログ（生のボディを含む）
  app.use("*", async (c, next) => {
    console.log(`${c.req.method} ${c.req.path}`);
    console.log("Headers:", JSON.stringify(Object.fromEntries(c.req.raw.headers.entries()), null, 2));

    // POSTリクエストの場合、ボディをログ出力
    if (c.req.method === "POST") {
      const clonedRequest = c.req.raw.clone();
      const rawBody = await clonedRequest.text();
      console.log("Raw body:", rawBody);
    }

    await next();
  });

  // ルーティング
  app.route("/webhook", buildWebhookRouter({ container }));

  // ヘルスチェック
  app.get("/health", (c) => c.json({ status: "ok" }));

  // 404ハンドラー
  app.notFound((c) => {
    return c.json({ error: "NotFound", message: "Endpoint not found" }, 404);
  });

  // グローバルエラーハンドラー
  app.onError((error, c) => {
    console.error("Unhandled error:", error);
    return buildErrorResponse(error, c);
  });

  return app;
};
