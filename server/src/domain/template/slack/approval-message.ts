import type { SlackMessage } from "./types.js";

/**
 * 承認リクエストメッセージの入力パラメータ
 */
export interface ApprovalMessageParams {
  channel: string;
  issueKey: string;
  issueSummary: string;
  issueUrl: string;
  callbackId: string;
}

/**
 * 承認ボタン付きSlackメッセージを構築
 */
export const buildApprovalMessage = (params: ApprovalMessageParams): SlackMessage => {
  const { channel, issueKey, issueSummary, issueUrl, callbackId } = params;

  return {
    channel,
    text: `課題 ${issueKey} が完了しました`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `課題完了: ${issueKey}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<${issueUrl}|${issueSummary}>*`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "このサマリーをBacklogのコメントとして投稿しますか？",
        },
      },
      {
        type: "actions",
        block_id: "approval_actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "承認して投稿",
              emoji: true,
            },
            style: "primary",
            action_id: "approve",
            value: JSON.stringify({
              callbackId,
              approved: true,
            }),
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "却下",
              emoji: true,
            },
            style: "danger",
            action_id: "reject",
            value: JSON.stringify({
              callbackId,
              approved: false,
            }),
          },
        ],
      },
    ],
  };
};
