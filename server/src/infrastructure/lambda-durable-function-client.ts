import {
  LambdaClient,
  InvokeCommand,
  SendDurableExecutionCallbackSuccessCommand,
  SendDurableExecutionCallbackFailureCommand,
} from "@aws-sdk/client-lambda";
import type {
  DurableFunctionClient,
  DurableFunctionParams,
  ApprovalResult,
  RejectionInfo,
} from "../domain/support/durable-function-client.js";

/**
 * Lambda を使用した Durable Function クライアント実装
 */
export class LambdaDurableFunctionClient implements DurableFunctionClient {
  readonly #lambdaClient: LambdaClient;
  readonly #functionName: string;

  constructor(lambdaClient: LambdaClient, functionName: string) {
    this.#lambdaClient = lambdaClient;
    this.#functionName = functionName;
  }

  async invoke(params: DurableFunctionParams): Promise<void> {
    // Durable Functionはqualified ARN（バージョン指定）が必要
    const command = new InvokeCommand({
      FunctionName: this.#functionName,
      Qualifier: "$LATEST",
      InvocationType: "Event",
      Payload: JSON.stringify(params),
    });

    await this.#lambdaClient.send(command);
  }

  async sendCallbackSuccess(callbackId: string, result: ApprovalResult): Promise<void> {
    const command = new SendDurableExecutionCallbackSuccessCommand({
      CallbackId: callbackId,
      Result: new TextEncoder().encode(JSON.stringify(result)),
    });

    await this.#lambdaClient.send(command);
  }

  async sendCallbackFailure(callbackId: string, rejection: RejectionInfo): Promise<void> {
    const command = new SendDurableExecutionCallbackFailureCommand({
      CallbackId: callbackId,
      Error: {
        ErrorType: "REJECTED",
        ErrorMessage: `Rejected by ${rejection.rejectedBy}`,
      },
    });

    await this.#lambdaClient.send(command);
  }
}
