import { createApiClient, type ApiClient } from '@/shared/api'
import { session } from '../model/session'

// Клиент для эндпоинтов уровня member/host: базовый путь /rooms/:roomId,
// Authorization из memberToken, при UNAUTHORIZED токен сбрасывается (CONTRACT.md, раздел 7)
export const memberClient = (roomId: string): ApiClient =>
  createApiClient({
    basePath: `/rooms/${encodeURIComponent(roomId)}`,
    getToken: () => session.getMemberToken(roomId),
    onUnauthorized: () => session.clearMemberToken(roomId),
  })
