/**
 * Backlogコメントの入力パラメータ
 */
export interface BacklogCommentParams {
  summary: string;
}

/**
 * 完了サマリーのBacklogコメントを構築
 */
export const buildBacklogComment = (params: BacklogCommentParams): string => {
  const { summary } = params;

  return `## 完了サマリー

${summary}
`;
};
