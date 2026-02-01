import { z } from "zod";
import type { BacklogWebhookEvent } from "../../../domain/model/backlog/backlog-event.js";

/**
 * Backlog Webhook リクエストスキーマ
 * @see https://developer.nulab.com/ja/docs/backlog/api/2/get-webhook/#webhook-event-payload
 */

export const IssueStatusSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const ChangeSchema = z.object({
  field: z.string(),
  new_value: z.string().optional(),
  old_value: z.string().optional(),
  type: z.string().optional(),
});

export const IssueContentSchema = z.object({
  id: z.number(),
  key_id: z.number(),
  summary: z.string(),
  description: z.string().optional(),
  status: IssueStatusSchema.optional(),
  changes: z.array(ChangeSchema).optional(),
});

export const ProjectSchema = z.object({
  id: z.number(),
  projectKey: z.string(),
  name: z.string(),
});

export const UserSchema = z.object({
  id: z.number(),
  userId: z.string().nullish(),
  name: z.string(),
  mailAddress: z.string().nullish(),
});

export const BacklogWebhookRequestSchema = z.object({
  id: z.number(),
  project: ProjectSchema,
  type: z.number(),
  content: IssueContentSchema,
  notifications: z.array(z.unknown()).optional(),
  createdUser: UserSchema,
  created: z.string(),
});

type BacklogWebhookRequestRaw = z.infer<typeof BacklogWebhookRequestSchema>;

/**
 * Zodスキーマの型からドメイン型へ変換
 */
export const toBacklogWebhookEvent = (
  raw: BacklogWebhookRequestRaw
): BacklogWebhookEvent => {
  return {
    id: raw.id,
    type: raw.type,
    project: raw.project,
    issue: {
      id: raw.content.id,
      keyId: raw.content.key_id,
      summary: raw.content.summary,
      description: raw.content.description,
      status: raw.content.status,
    },
    changes: raw.content.changes?.map((c) => ({
      field: c.field,
      newValue: c.new_value,
      oldValue: c.old_value,
    })),
  };
};
