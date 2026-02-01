import type { SlackMessage } from "./types.js";

/**
 * 完了通知メッセージの入力パラメータ
 */
export interface CompletionMessageParams {
  channel: string;
  issueKey: string;
  approved: boolean;
}

/**
 * 完了通知Slackメッセージを構築
 */
export const buildCompletionMessage = (params: CompletionMessageParams): SlackMessage => {
  const { channel, issueKey, approved } = params;

  const statusText = approved
    ? `:white_check_mark: 課題 ${issueKey} のコメントを投稿しました`
    : `:x: 課題 ${issueKey} のコメント投稿が却下されました`;

  return {
    channel,
    text: statusText,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: statusText,
        },
      },
    ],
  };
};
