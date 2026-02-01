/**
 * Durable Function クライアント インターフェース
 */

export interface DurableFunctionParams {
  issueKey: string;
  projectKey: string;
  issueSummary: string;
  issueDescription: string;
}

export interface ApprovalResult {
  approved: boolean;
  approvedBy: string;
  approvedAt: string;
}

export interface RejectionInfo {
  rejectedBy: string;
}

export interface DurableFunctionClient {
  /**
   * Durable Functionを起動
   */
  invoke(params: DurableFunctionParams): Promise<void>;

  /**
   * コールバック成功を送信
   */
  sendCallbackSuccess(callbackId: string, result: ApprovalResult): Promise<void>;

  /**
   * コールバック失敗を送信
   */
  sendCallbackFailure(callbackId: string, rejection: RejectionInfo): Promise<void>;
}
