/**
 * 環境変数が見つからないエラー
 */
class NotFoundEnvError extends Error {
  override name = "NotFoundEnvError" as const;
  constructor(envName: string) {
    super(`"${envName}" is not found in environment variables.`);
  }
}

/**
 * 環境変数の有無をチェックし、存在する場合は値を返す
 * 存在しない場合はデフォルト値を返すか、エラーを投げる
 *
 * @param envName 環境変数名
 * @param defaultValue デフォルト値（省略時は環境変数が必須）
 */
export const unwrapEnv = (envName: string, defaultValue?: string): string => {
  const envValue = process.env[envName];
  if (envValue == null) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new NotFoundEnvError(envName);
  }
  return envValue;
};
