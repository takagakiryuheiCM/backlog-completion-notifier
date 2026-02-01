#!/usr/bin/env node
/**
 * セットアップスクリプト
 * config.tsに必要な設定値を書き込む
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, "../infra/config.ts");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/** @param {string} prompt */
const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

async function main() {
  console.log("\n🔧 Backlog Completion Notifier セットアップ\n");

  const backlogSpaceId = await question(
    "Backlog スペースID: "
  );
  const slackChannelId = await question(
    "Slack チャンネルID: "
  );

  rl.close();

  const configContent = `import type { Config } from "./config-type";

/**
 * アプリケーション設定
 * デプロイ前にこのファイルを編集して設定を行う
 */
export const config: Config = {
  backlogSpaceId: "${backlogSpaceId}",
  slackChannelId: "${slackChannelId}",
};
`;

  fs.writeFileSync(CONFIG_PATH, configContent);

  console.log("\n✅ 設定を保存しました: infra/config.ts");
  console.log("\n次のステップ:");
  console.log("  1. AWS Secrets Managerに以下のシークレットを設定:");
  console.log("     - backlog-completion-notifier/backlog-api-key");
  console.log("     - backlog-completion-notifier/slack-bot-token");
  console.log("  2. pnpm deploy でデプロイ\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
