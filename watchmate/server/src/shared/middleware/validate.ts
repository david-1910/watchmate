import { Request, Response, NextFunction } from 'express'
import { sendError } from '../utils/response'

type Rule = {
  field: string
  type: 'string' | 'boolean'
  required?: boolean
  minLength?: number
}

export const validate =
  (rules: Rule[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    for (const rule of rules) {
      const value = req.body?.[rule.field]
      const missing = value === undefined || value === null || value === ''

      if (rule.required && missing) {
        sendError(res, `Поле "${rule.field}" обязательно`, 'VALIDATION_ERROR', 400)
        return
      }

      if (!missing) {
        if (rule.type === 'string' && typeof value !== 'string') {
          sendError(res, `Поле "${rule.field}" должно быть строкой`, 'VALIDATION_ERROR', 400)
          return
        }
        if (rule.type === 'boolean' && typeof value !== 'boolean') {
          sendError(res, `Поле "${rule.field}" должно быть булевым`, 'VALIDATION_ERROR', 400)
          return
        }
        if (rule.type === 'string' && rule.minLength && (value as string).trim().length < rule.minLength) {
          sendError(res, `Поле "${rule.field}" слишком короткое`, 'VALIDATION_ERROR', 400)
          return
        }
      }
    }

    next()
  }
