// Адрес комнаты: /room-<roomId>
const ROOM_SLUG_PREFIX = 'room-'

export const roomPath = (roomId: string): string => `/${ROOM_SLUG_PREFIX}${roomId}`

export const roomUrl = (roomId: string): string =>
  `${window.location.origin}${roomPath(roomId)}`

// roomId из сегмента пути "room-<roomId>", иначе null
export const parseRoomSlug = (slug: string | undefined): string | null =>
  slug?.startsWith(ROOM_SLUG_PREFIX) && slug.length > ROOM_SLUG_PREFIX.length
    ? slug.slice(ROOM_SLUG_PREFIX.length)
    : null
