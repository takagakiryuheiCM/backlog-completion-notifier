import type {
  BacklogRepository,
  BacklogIssue,
  BacklogComment,
} from "../domain/model/backlog/backlog-repository.js";

/**
 * Backlog API レスポンスの型定義（内部用）
 */
interface BacklogApiIssueResponse {
  id: number;
  projectId: number;
  issueKey: string;
  keyId: number;
  issueType: {
    id: number;
    name: string;
  };
  summary: string;
  description: string;
  status: {
    id: number;
    name: string;
  };
  priority: {
    id: number;
    name: string;
  };
  assignee?: {
    id: number;
    name: string;
  };
  createdUser: {
    id: number;
    name: string;
  };
  created: string;
  updated: string;
}

/**
 * Backlog API コメントレスポンスの型定義（内部用）
 */
interface BacklogApiCommentResponse {
  id: number;
  content: string;
  createdUser: {
    id: number;
    name: string;
  };
  created: string;
}

/**
 * APIレスポンス → ドメインモデル変換
 */
const toBacklogIssue = (response: BacklogApiIssueResponse): BacklogIssue => ({
  id: response.id,
  issueKey: response.issueKey,
  summary: response.summary,
  description: response.description,
});

const toBacklogComment = (response: BacklogApiCommentResponse): BacklogComment => ({
  id: response.id,
  content: response.content,
  createdUser: {
    name: response.createdUser.name,
  },
  created: response.created,
});

/**
 * Backlog API クライアント
 */
export class BacklogClient implements BacklogRepository {
  readonly #apiKey: string;
  readonly #spaceId: string;
  readonly #baseUrl: string;

  constructor(spaceId: string, apiKey: string) {
    this.#apiKey = apiKey;
    this.#spaceId = spaceId;
    this.#baseUrl = `https://${spaceId}.backlog.jp/api/v2`;
  }

  /**
   * 課題の詳細を取得
   */
  async getIssue(issueIdOrKey: string): Promise<BacklogIssue> {
    const url = `${this.#baseUrl}/issues/${issueIdOrKey}?apiKey=${this.#apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to get issue: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const apiResponse = (await response.json()) as BacklogApiIssueResponse;
    return toBacklogIssue(apiResponse);
  }

  /**
   * 課題のコメント一覧を取得（古い順）
   */
  async getComments(issueIdOrKey: string): Promise<BacklogComment[]> {
    // order=asc で古い順に取得
    const url = `${this.#baseUrl}/issues/${issueIdOrKey}/comments?apiKey=${this.#apiKey}&order=asc`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to get comments: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const apiResponse = (await response.json()) as BacklogApiCommentResponse[];
    return apiResponse
      .filter((comment) => comment.content) // 空コメント（ステータス変更のみ等）を除外
      .map(toBacklogComment);
  }

  /**
   * 課題にコメントを追加
   */
  async addComment(issueIdOrKey: string, content: string): Promise<void> {
    const response = await fetch(
      `${this.#baseUrl}/issues/${issueIdOrKey}/comments?apiKey=${this.#apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ content }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.statusText}`);
    }
  }

  /**
   * 課題のURLを生成
   */
  getIssueUrl(issueKey: string): string {
    return `https://${this.#spaceId}.backlog.jp/view/${issueKey}`;
  }
}
