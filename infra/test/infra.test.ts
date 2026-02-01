import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { ServerStack } from "../lib/stack/server-stack";
import type { Config } from "../config-type";

const testConfig: Config = {
  backlogSpaceId: "test-space",
  slackChannelId: "C123456789",
};

describe("ServerStack", () => {
  test("Lambda Functions Created", () => {
    const app = new cdk.App();
    const stack = new ServerStack(app, "TestStack", {
      config: testConfig,
    });

    const template = Template.fromStack(stack);

    // Durable Function
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "backlog-completion-durable",
      Runtime: "nodejs24.x",
    });

    // API Function (Monolithic)
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "backlog-completion-api",
      Runtime: "nodejs22.x",
    });
  });

  test("Function URL Created", () => {
    const app = new cdk.App();
    const stack = new ServerStack(app, "TestStack", {
      config: testConfig,
    });

    const template = Template.fromStack(stack);

    // Function URL
    template.hasResourceProperties("AWS::Lambda::Url", {
      AuthType: "NONE",
    });
  });
});
