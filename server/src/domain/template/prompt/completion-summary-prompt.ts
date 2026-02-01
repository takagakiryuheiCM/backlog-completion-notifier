/**
 * コメント情報
 */
export interface CommentInfo {
  userName: string;
  content: string;
  created: string;
}

/**
 * 完了サマリー生成用プロンプトの入力パラメータ
 */
export interface CompletionSummaryPromptParams {
  issueKey: string;
  issueSummary: string;
  issueDescription: string;
  comments?: CommentInfo[];
}

/**
 * コメント履歴をフォーマット
 */
const formatComments = (comments: CommentInfo[]): string => {
  if (comments.length === 0) {
    return "コメントなし";
  }

  return comments
    .map((comment) => {
      const date = new Date(comment.created).toLocaleDateString("ja-JP");
      return `- **${comment.userName}** (${date}): ${comment.content}`;
    })
    .join("\n");
};

/**
 * 完了サマリー生成用プロンプトを構築
 */
export const buildCompletionSummaryPrompt = (
  params: CompletionSummaryPromptParams
): string => {
  const { issueKey, issueSummary, issueDescription, comments = [] } = params;

  const commentsSection = formatComments(comments);

  return `あなたはプロジェクト管理のアシスタントです。
以下のBacklog課題が完了しました。課題の説明とコメント履歴（やり取り）を読み、完了サマリーをMarkdown形式で作成してください。

## 課題情報
- 課題キー: ${issueKey}
- タイトル: ${issueSummary}
- 説明: ${issueDescription || "説明なし"}

## コメント履歴（やり取り）
${commentsSection}

## 出力形式
以下の構造で出力してください:

# 完了サマリー

## 課題の内容
[課題の内容を簡潔に記載]

## 対応内容・経緯
[コメント履歴から、どのような議論や対応が行われたかを要約]

## 課題の結論
[課題がどのように解決・完了されたかを記載]

## 備考・補足事項
[追加で記録すべき情報があれば記載、なければ「特になし」]

## 記載のポイント
- 読みやすさを重視し、適切に箇条書きを使用
- 重要な決定事項は**太字**で強調
- コメント履歴の重要なやり取りを反映する
- 長くなりすぎないように簡潔にまとめる（各セクション2-4文程度）`;
};
