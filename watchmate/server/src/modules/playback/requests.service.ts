import { state } from '../state/state'
import { PendingRequest, PlaybackRequestType } from '../../shared/types'
import { generateId } from '../../shared/utils/generators'

// Запросы зрителей ждут ответа хоста; при удалении комнаты исчезают вместе с ней
const create = (roomId: string, fromUserId: string, type: PlaybackRequestType): string => {
  const id = generateId()
  const requests = state.roomRequests.get(roomId) ?? new Map<string, PendingRequest>()
  requests.set(id, { fromUserId, type })
  state.roomRequests.set(roomId, requests)
  return id
}

// Ответ хоста: запрос закрывается; null — запроса нет (уже отвечен или чужой комнаты)
const answer = (roomId: string, requestId: string): PendingRequest | null => {
  const requests = state.roomRequests.get(roomId)
  const request = requests?.get(requestId) ?? null
  if (request) requests?.delete(requestId)
  return request
}

export const requestsService = { create, answer }
