import { aws_ssm } from "aws-cdk-lib";
import { Construct } from "constructs";

/**
 * SSMパラメータストアから値を取得する
 * パラメータ名の形式: /backlog-completion-notifier/{key}
 */
const fetchParameter = ({
  construct,
  key,
}: {
  construct: Construct;
  key: string;
}) =>
  aws_ssm.StringParameter.valueForStringParameter(
    construct,
    `/backlog-completion-notifier/${key}`,
  );

/**
 * Lambda関数の環境変数に設定する秘匿情報をSSMパラメータストアから取得する
 *
 * 事前に以下のSSMパラメータを作成しておく必要があります:
 * - /backlog-completion-notifier/BACKLOG_API_KEY
 * - /backlog-completion-notifier/SLACK_BOT_TOKEN
 */
export const loadLambdaSecretEnv = ({
  construct,
}: {
  construct: Construct;
}) => ({
  BACKLOG_API_KEY: fetchParameter({
    construct,
    key: "BACKLOG_API_KEY",
  }),
  SLACK_BOT_TOKEN: fetchParameter({
    construct,
    key: "SLACK_BOT_TOKEN",
  }),
});
