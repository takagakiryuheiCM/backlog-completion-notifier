import type { Context, MiddlewareHandler } from "hono";
import type { ZodTypeAny } from "zod";
import { InvalidError } from "../../../util/error-util.js";

/**
 * Slackのform-urlencoded payloadをパースしてバリデーションするミドルウェア
 */
export const slackPayloadValidator = (schema: ZodTypeAny): MiddlewareHandler => {
  return async (c: Context, next) => {
    const formData = await c.req.parseBody();
    const payloadStr = formData["payload"];

    if (typeof payloadStr !== "string") {
      throw new InvalidError("Payload is required");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadStr);
    } catch {
      throw new InvalidError("Invalid JSON in payload");
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new InvalidError("Invalid Slack payload");
    }

    // バリデーション結果をコンテキストに保存
    c.set("slackPayload", result.data);
    await next();
  };
};

/**
 * バリデーション済みのSlack payloadを取得
 */
export const getValidSlackPayload = <T>(c: Context): T => {
  return c.get("slackPayload") as T;
};
