export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  CAPTCHA_INVALID = "CAPTCHA_INVALID",
  CAPTCHA_EXPIRED = "CAPTCHA_EXPIRED",
  RATE_LIMITED = "RATE_LIMITED",
  AI_ERROR = "AI_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export function apiOk<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function apiErr(code: string, message: string): ApiResponse {
  return { success: false, error: { code, message } };
}
