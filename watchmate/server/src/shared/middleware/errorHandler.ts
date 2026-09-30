import { Request, Response, NextFunction } from 'express'
import { sendError, sendNotFound, sendValidationError } from '../utils/response'

// Ошибки разбора тела запроса из express.json
const BODY_ERRORS = new Set(['entity.parse.failed', 'entity.too.large'])

export const notFoundHandler = (req: Request, res: Response): void => {
  sendNotFound(res, `Маршрут ${req.method} ${req.path} не найден`)
}

export const errorHandler = (
  err: Error & { type?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err.type && BODY_ERRORS.has(err.type)) {
    sendValidationError(res, 'Некорректное тело запроса')
    return
  }
  console.error('[ERROR]', err.message)
  sendError(res, 'Внутренняя ошибка сервера', 'INTERNAL_ERROR', 500)
}
