import type { Context } from "hono";
import {
  InvalidError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UNEXPECTED_ERROR_MESSAGE,
} from "../util/error-util.js";

/**
 * エラーレスポンスの型定義
 */
interface ErrorResponse {
  error: string;
  message: string;
}

/**
 * エラーに応じたHTTPレスポンスを構築
 */
export const buildErrorResponse = (
  error: Error,
  c: Context
): Response => {
  const response: ErrorResponse = {
    error: error.name,
    message: error.message,
  };

  if (error instanceof InvalidError) {
    console.info("入力不正エラー", { error: error.message });
    return c.json(response, 400);
  }

  if (error instanceof AuthenticationError) {
    console.info("認証エラー", { error: error.message });
    return c.json(response, 401);
  }

  if (error instanceof ForbiddenError) {
    console.info("禁止エラー", { error: error.message });
    return c.json(response, 403);
  }

  if (error instanceof NotFoundError) {
    console.info("リソース未検出エラー", { error: error.message });
    return c.json(response, 404);
  }

  if (error instanceof ConflictError) {
    console.info("競合エラー", { error: error.message });
    return c.json(response, 409);
  }

  // 500番台のエラーは詳細を隠す
  console.error("予期せぬエラー", error);
  return c.json(
    {
      error: "InternalServerError",
      message: UNEXPECTED_ERROR_MESSAGE,
    },
    500
  );
};
