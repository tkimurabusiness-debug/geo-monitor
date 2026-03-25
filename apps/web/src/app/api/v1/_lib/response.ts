import { NextResponse } from "next/server";
import { ApiError, ErrorCode } from "./errors";

/** Unified success response */
export function success<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

/** Unified paginated response */
export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
) {
  return NextResponse.json({
    data,
    pagination: { total, page, per_page: perPage },
    error: null,
  });
}

/** Unified error response */
export function error(err: ApiError | Error | unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { data: null, error: { code: err.code, message: err.message } },
      { status: err.status },
    );
  }

  console.error("[API Error]", err);
  return NextResponse.json(
    {
      data: null,
      error: {
        code: ErrorCode.INTERNAL,
        message: "サーバーエラーが発生しました",
      },
    },
    { status: 500 },
  );
}

/** Wrap a handler with automatic error catching */
export function withErrorHandling(
  handler: (req: Request, ctx: any) => Promise<NextResponse>,
) {
  return async (req: Request, ctx: any) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return error(err);
    }
  };
}
