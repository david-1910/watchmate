import { EventEmitter } from 'events'

// Доменные события жизненного цикла комнаты и участников. Сервисы их публикуют
// (в том числе из таймеров), транспорт подписывается и рассылает по сокетам.
// Так сервисы не зависят от Socket.IO
type RoomEventMap = {
  'users-changed': [roomId: string]
  'host-changed': [roomId: string, hostId: string | null]
  'ready-changed': [roomId: string]
  'member-removed': [roomId: string, userId: string]
  'room-deleted': [roomId: string]
}

export const roomEvents = new EventEmitter<RoomEventMap>()
