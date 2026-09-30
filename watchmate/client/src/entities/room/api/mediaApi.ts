import { memberClient } from './memberClient'
import type {
  QueueItem,
  Suggestion,
  PlayedResult,
  AcceptSuggestionResult,
} from '../model/types'

// Видео, очередь и предложения (CONTRACT.md, раздел 5).
// Состояние обновляется broadcast-событиями, ответы нужны для обработки ошибок

// host
export const setVideo = (roomId: string, url: string) =>
  memberClient(roomId).put<{ video: string }>('/video', { url })

export const clearVideo = (roomId: string) =>
  memberClient(roomId).delete<{ video: '' }>('/video')

export const addToQueue = (roomId: string, url: string, title?: string) =>
  memberClient(roomId).post<QueueItem[]>('/queue', { url, title })

export const removeFromQueue = (roomId: string, itemId: string) =>
  memberClient(roomId).delete<QueueItem[]>(`/queue/${encodeURIComponent(itemId)}`)

export const playQueueItem = (roomId: string, itemId: string) =>
  memberClient(roomId).patch<PlayedResult>(`/queue/${encodeURIComponent(itemId)}/play`)

export const playNextInQueue = (roomId: string) =>
  memberClient(roomId).patch<PlayedResult>('/queue/next')

export const reorderQueue = (roomId: string, fromIndex: number, toIndex: number) =>
  memberClient(roomId).patch<QueueItem[]>('/queue/reorder', { fromIndex, toIndex })

export const acceptSuggestion = (roomId: string, suggestionId: string) =>
  memberClient(roomId).patch<AcceptSuggestionResult>(
    `/suggestions/${encodeURIComponent(suggestionId)}/accept`
  )

export const rejectSuggestion = (roomId: string, suggestionId: string) =>
  memberClient(roomId).delete<Suggestion[]>(
    `/suggestions/${encodeURIComponent(suggestionId)}`
  )

// member
export const suggestVideo = (roomId: string, url: string, title?: string) =>
  memberClient(roomId).post<Suggestion[]>('/suggestions', { url, title })
