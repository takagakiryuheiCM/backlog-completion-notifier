/**
 * Slack Interactive Messageレスポンスの型
 */
export interface SlackInteractiveResponse {
  replace_original: boolean;
  text: string;
}

/**
 * 承認結果のレスポンスパラメータ
 */
export interface ApprovalResponseParams {
  approved: boolean;
  userName: string;
}

/**
 * 承認結果のSlackレスポンスを構築
 */
export const buildApprovalResponse = (
  params: ApprovalResponseParams
): SlackInteractiveResponse => {
  const { approved, userName } = params;

  return {
    replace_original: true,
    text: approved
      ? `:white_check_mark: ${userName} さんが承認しました。コメントを投稿中...`
      : `:x: ${userName} さんが却下しました。`,
  };
};
