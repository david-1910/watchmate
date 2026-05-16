import { Request, Response, NextFunction } from 'express'
import { sendError } from '../utils/response'

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Маршрут ${req.method} ${req.path} не найден`, 'NOT_FOUND', 404)
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[ERROR]', err.message)
  sendError(res, 'Внутренняя ошибка сервера', 'INTERNAL_ERROR', 500)
}
