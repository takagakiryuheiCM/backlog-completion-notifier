/**
 * Backlog リポジトリ インターフェース
 *
 * Backlog課題の操作を担当する
 */

/**
 * Backlog 課題（リポジトリから取得する形式）
 */
export interface BacklogIssue {
  id: number;
  issueKey: string;
  summary: string;
  description: string;
}

/**
 * Backlog コメント
 */
export interface BacklogComment {
  id: number;
  content: string;
  createdUser: {
    name: string;
  };
  created: string;
}

/**
 * BacklogRepository インターフェース
 */
export interface BacklogRepository {
  /**
   * 課題を取得する
   *
   * @param issueIdOrKey 課題IDまたは課題キー
   * @returns 課題情報
   */
  getIssue(issueIdOrKey: string): Promise<BacklogIssue>;

  /**
   * 課題のコメント一覧を取得する
   *
   * @param issueIdOrKey 課題IDまたは課題キー
   * @returns コメント一覧（古い順）
   */
  getComments(issueIdOrKey: string): Promise<BacklogComment[]>;

  /**
   * 課題にコメントを追加する
   *
   * @param issueIdOrKey 課題IDまたは課題キー
   * @param content コメント内容
   */
  addComment(issueIdOrKey: string, content: string): Promise<void>;

  /**
   * 課題のURLを取得する
   *
   * @param issueKey 課題キー
   * @returns 課題のURL
   */
  getIssueUrl(issueKey: string): string;
}
