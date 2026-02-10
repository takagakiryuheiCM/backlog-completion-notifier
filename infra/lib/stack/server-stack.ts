import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as path from "path";
import type { Config } from "../../config-type";
import { loadLambdaSecretEnv } from "../util/ssm";

export interface ServerStackProps extends cdk.StackProps {
  config: Config;
}

export class ServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServerStackProps) {
    super(scope, id, props);

    const { config } = props;

    // SSMパラメータストアから秘匿情報を取得
    const { BACKLOG_API_KEY, SLACK_BOT_TOKEN } = loadLambdaSecretEnv({
      construct: this,
    });

    // 共通の環境変数
    const commonEnv = {
      TZ: "Asia/Tokyo",
    };

    // サーバーコードのパス
    const serverSrcPath = path.join(__dirname, "../../../server/src");

    // ===========================================
    // Durable Function Lambda
    // ===========================================
    const durableFunctionName = "backlog-completion-durable";

    const durableFunctionLogGroup = new logs.LogGroup(
      this,
      "DurableFunctionLogGroup",
      {
        logGroupName: `/aws/lambda/${durableFunctionName}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        retention: logs.RetentionDays.ONE_MONTH,
      }
    );

    const durableFunction = new nodejs.NodejsFunction(this, "DurableFunction", {
      functionName: durableFunctionName,
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(serverSrcPath, "handler/durable/handler.ts"),
      handler: "handler",
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      architecture: lambda.Architecture.ARM_64,
      logGroup: durableFunctionLogGroup,
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      environment: {
        ...commonEnv,
        BACKLOG_API_KEY,
        BACKLOG_SPACE_ID: config.backlogSpaceId,
        SLACK_BOT_TOKEN,
        SLACK_CHANNEL_ID: config.slackChannelId,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
      // Durable Functionsの設定
      durableConfig: {
        executionTimeout: cdk.Duration.days(1),
        retentionPeriod: cdk.Duration.days(7),
      },
    });

    // Durable FunctionにBedrock呼び出し権限を付与
    durableFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "aws-marketplace:ViewSubscriptions",
          "aws-marketplace:Subscribe",
        ],
        resources: ["*"],
      })
    );

    // ===========================================
    // API Lambda (Monolithic - Hono)
    // Backlog/Slack Webhook受信を1つのLambdaで処理
    // ===========================================
    const apiFunctionName = "backlog-completion-api";

    const apiFunctionLogGroup = new logs.LogGroup(this, "ApiFunctionLogGroup", {
      logGroupName: `/aws/lambda/${apiFunctionName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_MONTH,
    });

    const apiFunction = new nodejs.NodejsFunction(this, "ApiFunction", {
      functionName: apiFunctionName,
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(serverSrcPath, "handler/api/handler.ts"),
      handler: "handler",
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      architecture: lambda.Architecture.ARM_64,
      logGroup: apiFunctionLogGroup,
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.DEBUG,
      environment: {
        ...commonEnv,
        DURABLE_FUNCTION_NAME: durableFunctionName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        // Durable Execution SDKのコマンドを正しくバンドルするため、
        // AWS SDKをバンドルに含める（Lambda Runtimeのバージョンより新しい機能を使用）
        nodeModules: ["@aws-sdk/client-lambda"],
      },
    });

    // API LambdaがDurable Functionを呼び出す権限
    durableFunction.grantInvoke(apiFunction);

    // API LambdaがDurable Functionのコールバックを送信する権限
    // Durable Executionのサブリソースパス（:$LATEST/durable-execution/...）にもアクセスするため
    // ワイルドカードを使用
    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "lambda:SendDurableExecutionCallbackSuccess",
          "lambda:SendDurableExecutionCallbackFailure",
        ],
        resources: [
          durableFunction.functionArn,
          `${durableFunction.functionArn}:*`,
        ],
      })
    );

    // Function URLでAPIを公開
    const apiFunctionUrl = apiFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // ===========================================
    // Outputs
    // ===========================================
    new cdk.CfnOutput(this, "ApiUrl", {
      value: apiFunctionUrl.url,
      description: "API Base URL",
    });

    new cdk.CfnOutput(this, "BacklogWebhookUrl", {
      value: `${apiFunctionUrl.url}webhook/backlog`,
      description: "BacklogのWebhook設定に登録するURL",
    });

    new cdk.CfnOutput(this, "SlackWebhookUrl", {
      value: `${apiFunctionUrl.url}webhook/slack`,
      description: "SlackのInteractivity設定に登録するURL",
    });

    new cdk.CfnOutput(this, "DurableFunctionName", {
      value: durableFunctionName,
      description: "Durable Function名",
    });
  }
}
