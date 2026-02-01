/**
 * サマリー生成 インターフェース
 * プロンプトを受け取り、AI生成結果を返す
 */
export interface SummaryGenerator {
  generate(prompt: string): Promise<string>;
}
