import type { FetchNow } from "../../domain/support/fetch-now/index.js";

/**
 * 現在時刻を取得する実装
 */
export const buildFetchNow = (): FetchNow => {
  return () => new Date();
};