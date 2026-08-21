import { NextResponse } from "next/server";

/**
 * Every API route in this project responds with this exact shape.
 * Documented in CLAUDE.md under "API Structure" — do not diverge
 * from it in new routes without updating that doc.
 */
export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export function apiSuccess<T>(
  data: T,
  init?: {
    message?: string;
    status?: number;
    pagination?: ApiSuccessBody<T>["pagination"];
  },
) {
  const body: ApiSuccessBody<T> = {
    success: true,
    data,
    ...(init?.message ? { message: init.message } : {}),
    ...(init?.pagination ? { pagination: init.pagination } : {}),
  };
  return NextResponse.json(body, { status: init?.status ?? 200 });
}

export function apiError(
  message: string,
  init?: { status?: number; errors?: Record<string, string[]> },
) {
  const body: ApiErrorBody = {
    success: false,
    message,
    ...(init?.errors ? { errors: init.errors } : {}),
  };
  return NextResponse.json(body, { status: init?.status ?? 400 });
}
