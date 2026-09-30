import rateLimit from 'express-rate-limit'

// Лимиты из CONTRACT.md, раздел 3. IP клиента за прокси — через app.set('trust proxy')

const rateLimitMessage = (message: string) => ({
  success: false,
  error: { message, code: 'RATE_LIMIT' },
})

const FIFTEEN_MINUTES = 15 * 60 * 1000
const ONE_HOUR = 60 * 60 * 1000

export const globalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('Слишком много запросов'),
})

export const createRoomLimiter = rateLimit({
  windowMs: ONE_HOUR,
  max: 10,
  message: rateLimitMessage('Слишком много комнат создано'),
})

export const joinLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 10,
  skipSuccessfulRequests: true,
  message: rateLimitMessage('Слишком много попыток входа'),
})

export const codeLookupLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 20,
  skipSuccessfulRequests: true,
  message: rateLimitMessage('Слишком много попыток ввода кода'),
})
