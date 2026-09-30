import type { ApiClient } from '@/shared/api'
import type { ChatMessage, MessagesPage } from '../model/types'

// client — авторизованный клиент комнаты (базовый путь /rooms/:roomId)

export const fetchMessages = (client: ApiClient, afterSeq: number) =>
  client.get<MessagesPage>(`/messages?afterSeq=${afterSeq}`)

// Идемпотентно по clientId
export const postMessage = (
  client: ApiClient,
  body: { clientId: string; message: string }
) => client.post<ChatMessage>('/messages', body)
