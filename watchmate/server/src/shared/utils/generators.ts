export const generateRoomId = (): string =>
  Math.random().toString(36).substring(2, 8).toUpperCase()

export const generateHostToken = (): string =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15)

export const generateId = (): string => Date.now().toString()
