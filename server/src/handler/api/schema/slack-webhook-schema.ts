import { z } from "zod";

/**
 * Slack Interactive Payload リクエストスキーマ
 * @see https://api.slack.com/reference/interaction-payloads
 */

/**
 * アクションボタンの値のスキーマ
 */
export const ActionValueSchema = z.object({
  callbackId: z.string(),
  approved: z.boolean(),
});

export type ActionValue = z.infer<typeof ActionValueSchema>;

/**
 * Slackアクションスキーマ
 * valueはJSON文字列なので、パースしてActionValueに変換
 */
export const SlackActionSchema = z.object({
  action_id: z.string(),
  block_id: z.string(),
  type: z.string(),
  value: z.string().transform((val, ctx) => {
    try {
      const parsed = JSON.parse(val) as unknown;
      const result = ActionValueSchema.safeParse(parsed);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid action value format",
        });
        return z.NEVER;
      }
      return result.data;
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid JSON in action value",
      });
      return z.NEVER;
    }
  }),
  action_ts: z.string(),
});

export type SlackAction = z.infer<typeof SlackActionSchema>;

export const SlackWebhookRequestSchema = z.object({
  type: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    name: z.string(),
  }),
  api_app_id: z.string(),
  token: z.string(),
  container: z.object({
    type: z.string(),
    message_ts: z.string(),
    channel_id: z.string(),
  }),
  channel: z.object({
    id: z.string(),
    name: z.string(),
  }),
  message: z.object({
    ts: z.string(),
    text: z.string(),
  }),
  response_url: z.string(),
  actions: z.array(SlackActionSchema).min(1),
});

export type SlackWebhookRequest = z.infer<typeof SlackWebhookRequestSchema>;
