const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_V4.test(value)

// roomId — UUID строго в нижнем регистре
export const isRoomId = (value: unknown): value is string => isUuid(value) && value === value.toLowerCase()

// Непустая (после trim) строка не длиннее max
export const isBoundedString = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max
