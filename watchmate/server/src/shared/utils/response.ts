import { Response } from 'express'
import type { ApiSuccess, ApiError } from '../types'

export const sendSuccess = <T>(res: Response, data: T, status = 200): void => {
  const body: ApiSuccess<T> = { success: true, data }
  res.status(status).json(body)
}

export const sendError = (res: Response, message: string, code: string, status: number): void => {
  const body: ApiError = { success: false, error: { message, code } }
  res.status(status).json(body)
}

export const sendNotFound = (res: Response, message: string): void => sendError(res, message, 'NOT_FOUND', 404)

export const sendValidationError = (res: Response, message: string): void =>
  sendError(res, message, 'VALIDATION_ERROR', 400)
