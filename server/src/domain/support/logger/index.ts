/**
 * ロガー
 * 各ログレベルは『システム運用アンチパターン』の「3.5.2 何を記録すべきか？」を参考
 */
export type AdditionalData =
  | Error
  | {
      [key: string]: unknown;
    };

/**
 * Logger インターフェース
 */
export type Logger = {
  /**
   * プログラム内で起こっていることに関連するあらゆる情報。デバッグのためのメッセージなど
   *
   * @param message ログメッセージ
   * @param data 付加情報
   */
  debug(message: string, data?: AdditionalData): void;

  /**
   * ユーザが開始したアクションや、スケジュールされたタスクの実行、システムのスタートアップやシャットダウンなどのシステム操作
   *
   * @param message ログメッセージ
   * @param data 付加情報
   */
  info(message: string, data?: AdditionalData): void;

  /**
   * 将来的にエラーになる可能性の状態。ライブラリ廃止警告、使用可能リソースの不足、パフォーマンス低下など
   *
   * @param message ログメッセージ
   * @param data 付加情報
   */
  warn(message: string, data?: AdditionalData): void;

  /**
   * すべてのエラー状態
   *
   * @param message ログメッセージ
   * @param data 付加情報
   */
  error(message: string, data?: AdditionalData): void;

  /**
   * ログに追加するキーを追加する
   *
   * @param params 追加するキーと値
   * @example
   * logger.appendKeys({ userId: "user1" });
   * logger.info("ログメッセージ");
   * // => { userId: "user1", message: "ログメッセージ" }
   */
  appendKeys(params: { [key: string]: unknown }): void;

  /**
   * ログから指定したキーを削除する
   *
   * @param keys 削除するキー
   */
  removeKeys(keys: string[]): void;
};
