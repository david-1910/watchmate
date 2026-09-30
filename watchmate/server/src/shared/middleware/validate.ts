import { Request, Response, NextFunction } from 'express'
import { sendError } from '../utils/response'
import { isUuid } from '../utils/validators'

type Rule = {
  field: string
  type: 'string' | 'boolean' | 'integer' | 'uuid'
  required?: boolean
  minLength?: number
  maxLength?: number
}

const TYPE_CHECKS: Record<Rule['type'], { check: (v: unknown) => boolean; label: string }> = {
  string: { check: (v) => typeof v === 'string', label: 'строкой' },
  boolean: { check: (v) => typeof v === 'boolean', label: 'булевым' },
  integer: { check: (v) => Number.isInteger(v), label: 'целым числом' },
  uuid: { check: isUuid, label: 'UUID' },
}

const fail = (res: Response, message: string): void => sendError(res, message, 'VALIDATION_ERROR', 400)

export const validate =
  (rules: Rule[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    for (const rule of rules) {
      const value = req.body?.[rule.field]
      const missing = value === undefined || value === null || value === ''

      if (missing) {
        if (rule.required) return fail(res, `Поле "${rule.field}" обязательно`)
        continue
      }

      const { check, label } = TYPE_CHECKS[rule.type]
      if (!check(value)) return fail(res, `Поле "${rule.field}" должно быть ${label}`)

      if (rule.minLength && (value as string).trim().length < rule.minLength) {
        return fail(res, `Поле "${rule.field}" слишком короткое`)
      }
      if (rule.maxLength && (value as string).length > rule.maxLength) {
        return fail(res, `Поле "${rule.field}" слишком длинное`)
      }
    }

    next()
  }
