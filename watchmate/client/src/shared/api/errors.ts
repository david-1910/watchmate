// Стандартные коды ошибок (CONTRACT.md, раздел 5)
export const API_ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  WRONG_PASSWORD: 'WRONG_PASSWORD',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
} as const

// status = 0 — запрос не дошёл до сервера (нет сети, CORS, обрыв)
export class ApiError extends Error {
  readonly status: number
  readonly code: string | null

  constructor(status: number, code: string | null, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const isApiError = (err: unknown, code: string): boolean =>
  err instanceof ApiError && err.code === code

// Текст ошибки для пользователя: сервер присылает его на русском (CONTRACT.md, раздел 5)
export const getErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof ApiError && err.message ? err.message : fallback

// Повторять имеет смысл только сетевые ошибки и 5xx
export const isRetryableError = (err: unknown): boolean =>
  err instanceof ApiError && (err.status === 0 || err.status >= 500)
