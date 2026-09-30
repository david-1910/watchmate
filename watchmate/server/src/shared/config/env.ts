import 'dotenv/config'
import { MEMBER_GRACE_MS, ROOM_EMPTY_TTL_MS, HOST_GRACE_MS } from '../constants/timings'

// Положительное целое из env, иначе значение по умолчанию
const positiveIntFromEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value > 0 ? value : fallback
}

export const env = {
  port: positiveIntFromEnv('PORT', 3001),
  // За прокси: IP клиента берётся из X-Forwarded-For
  trustProxy: process.env.TRUST_PROXY === '1',
  memberGraceMs: positiveIntFromEnv('MEMBER_GRACE_MS', MEMBER_GRACE_MS),
  roomEmptyTtlMs: positiveIntFromEnv('ROOM_EMPTY_TTL_MS', ROOM_EMPTY_TTL_MS),
  hostGraceMs: positiveIntFromEnv('HOST_GRACE_MS', HOST_GRACE_MS),
} as const
