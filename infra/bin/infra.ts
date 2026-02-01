#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ServerStack } from "../lib/stack/server-stack";
import { config } from "../config";

const app = new cdk.App();

new ServerStack(app, "BacklogCompletionNotifierStack", {
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
