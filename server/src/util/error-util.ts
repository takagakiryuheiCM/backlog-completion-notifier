/**
 * 各層で使うエラーの基底クラス
 * プレゼンター層ではこのエラークラスを元にハンドリングを行う
 */

/**
 * 不正なリクエストエラー（400）
 */
export class InvalidError extends Error {
  override name = "InvalidError" as const;
  constructor(detail?: string, options?: ErrorOptions) {
    const message = `不正なリクエストが送信されました${detail ? `: ${detail}` : ""}`;
    super(message, options);
  }
}

/**
 * 認証エラー（401）
 */
export class AuthenticationError extends Error {
  override name = "AuthenticationError" as const;
  constructor(detail?: string, options?: ErrorOptions) {
    const message = `認証エラーが発生しました${detail ? `: ${detail}` : ""}`;
    super(message, options);
  }
}

/**
 * 禁止エラー（403）
 */
export class ForbiddenError extends Error {
  override name = "ForbiddenError" as const;
  constructor(detail?: string, options?: ErrorOptions) {
    const message = `その操作は禁止されています${detail ? `: ${detail}` : ""}`;
    super(message, options);
  }
}

/**
 * リソース未検出エラー（404）
 */
export class NotFoundError extends Error {
  override name = "NotFoundError" as const;
  constructor(detail?: string, options?: ErrorOptions) {
    const message = `対象のリソースが見つかりませんでした${detail ? `: ${detail}` : ""}`;
    super(message, options);
  }
}

/**
 * 競合エラー（409）
 */
export class ConflictError extends Error {
  override name = "ConflictError" as const;
  constructor(detail?: string, options?: ErrorOptions) {
    const message = `他の操作と競合しました${detail ? `: ${detail}` : ""}`;
    super(message, options);
  }
}

/**
 * 内部サーバーエラー（500）
 */
export class InternalServerError extends Error {
  override name = "InternalServerError" as const;
  constructor(message = "サーバーサイドエラーが発生しました", options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * 予期せぬエラーのメッセージ
 */
export const UNEXPECTED_ERROR_MESSAGE = "予期せぬエラーが発生しました";
