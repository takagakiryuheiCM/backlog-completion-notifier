/**
 * Backlog Webhook イベントの型定義とドメインロジック
 */

// ============================================
// 定数
// ============================================

/**
 * Backlogのイベントタイプ
 * @see https://developer.nulab.com/ja/docs/backlog/api/2/get-webhook/#webhook-event-type
 */
export const BacklogEventType = {
  ISSUE_CREATED: 1,
  ISSUE_UPDATED: 2,
  ISSUE_COMMENTED: 3,
  ISSUE_DELETED: 4,
} as const;

/**
 * 課題のステータスID
 * Backlogの標準ステータス
 */
export const IssueStatusId = {
  OPEN: 1,
  IN_PROGRESS: 2,
  RESOLVED: 3,
  CLOSED: 4,
} as const;

// ============================================
// 型定義
// ============================================

/**
 * Backlog プロジェクト
 */
export interface BacklogProject {
  id: number;
  projectKey: string;
  name: string;
}

/**
 * Backlog 課題ステータス
 */
export interface BacklogIssueStatus {
  id: number;
  name: string;
}

/**
 * Backlog 課題
 */
export interface BacklogIssue {
  id: number;
  keyId: number;
  summary: string;
  description: string | undefined;
  status: BacklogIssueStatus | undefined;
}

/**
 * Backlog 変更内容
 */
export interface BacklogChange {
  field: string;
  newValue: string | undefined;
  oldValue: string | undefined;
}


/**
 * ============================================
 * Backlog Webhook イベントモデル
 * ============================================
 * Backlogから受け取るWebhookイベントの構造を表す
 * 外部APIの構造から独立した、ビジネスロジックで必要な型のみ定義
 */
export interface BacklogWebhookEvent {
  id: number;
  type: number;
  project: BacklogProject;
  issue: BacklogIssue;
  changes: BacklogChange[] | undefined;
}


// ============================================
// ユーティリティ関数
// ============================================

/**
 * 課題が完了状態かどうかを判定
 */
export const isIssueCompleted = (event: BacklogWebhookEvent): boolean => {
  // ステータスが「完了」または「解決」に変更された場合
  const statusChange = event.changes?.find((change) => change.field === "status");
  if (statusChange) {
    const newStatusId = parseInt(statusChange.newValue || "0", 10);
    return newStatusId === IssueStatusId.RESOLVED || newStatusId === IssueStatusId.CLOSED;
  }

  // コンテンツのステータスを確認
  const statusId = event.issue.status?.id;
  return statusId === IssueStatusId.RESOLVED || statusId === IssueStatusId.CLOSED;
};

/**
 * 課題のキーを生成（例: PROJECT-123）
 */
export const getIssueKey = (event: BacklogWebhookEvent): string => {
  return `${event.project.projectKey}-${event.issue.keyId}`;
};
