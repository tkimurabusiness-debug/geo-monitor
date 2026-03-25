/** Standard API error codes */
export const ErrorCode = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  PLAN_LIMIT: "PLAN_LIMIT",
  INTERNAL: "INTERNAL_ERROR",
  VALIDATION: "VALIDATION_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 400,
  ) {
    super(message);
  }
}

/** Convenience constructors */
export const Errors = {
  badRequest: (msg: string) => new ApiError(ErrorCode.BAD_REQUEST, msg, 400),
  unauthorized: (msg = "認証が必要です") =>
    new ApiError(ErrorCode.UNAUTHORIZED, msg, 401),
  forbidden: (msg = "権限がありません") =>
    new ApiError(ErrorCode.FORBIDDEN, msg, 403),
  notFound: (resource = "リソース") =>
    new ApiError(ErrorCode.NOT_FOUND, `${resource}が見つかりません`, 404),
  conflict: (msg: string) => new ApiError(ErrorCode.CONFLICT, msg, 409),
  planLimit: (resource: string) =>
    new ApiError(ErrorCode.PLAN_LIMIT, `プランの${resource}上限に達しています`, 403),
  internal: (msg = "サーバーエラーが発生しました") =>
    new ApiError(ErrorCode.INTERNAL, msg, 500),
  validation: (msg: string) =>
    new ApiError(ErrorCode.VALIDATION, msg, 422),
};
