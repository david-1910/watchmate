// Строго по CONTRACT.md, раздел 6. Синхронизировано с сервером
export const SOCKET_EVENTS = {
  // Client → Server (и reaction: Server → Client)
  PLAYBACK_SYNC: 'playback-sync',
  REACTION: 'reaction',
  PLAYBACK_REQUEST: 'playback-request',
  PLAYBACK_REQUEST_ANSWER: 'playback-request-answer',

  // Server → Client
  USERS_UPDATE: 'users-update',
  HOST_UPDATE: 'host-update',
  ROOM_UPDATE: 'room-update',
  MESSAGE_NEW: 'message-new',
  VIDEO_UPDATE: 'video-update',
  PLAYBACK_UPDATE: 'playback-update',
  PLAYBACK_REQUEST_NOTIFY: 'playback-request-notify',
  PLAYBACK_REQUEST_ANSWERED: 'playback-request-answered',
  READY_UPDATE: 'ready-update',
  COUNTDOWN: 'countdown',
  QUEUE_UPDATE: 'queue-update',
  SUGGESTIONS_UPDATE: 'suggestions-update',
  SESSION_ENDED: 'session-ended',
} as const
