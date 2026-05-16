import { Response } from 'express'
import type { ApiSuccess, ApiError } from '../types/response'

export const sendSuccess = <T>(res: Response, data: T, status = 200): void => {
  const body: ApiSuccess<T> = { success: true, data }
  res.status(status).json(body)
}

export const sendError = (res: Response, message: string, code: string, status: number): void => {
  const body: ApiError = { success: false, error: { message, code } }
  res.status(status).json(body)
}
