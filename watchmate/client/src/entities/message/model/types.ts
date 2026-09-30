// CONTRACT.md, раздел 4
export type ChatMessage = {
  id: string
  clientId: string
  seq: number
  userId: string
  userName: string
  message: string
  timestamp: string
}

// Клиентское состояние отправки (CONTRACT.md, раздел 7 «Sending a message»)
export type MessageStatus = 'pending' | 'sent' | 'failed'

// Сообщение в ленте: у неотправленного ещё нет id и seq от сервера
export type DisplayMessage = Omit<ChatMessage, 'id' | 'seq'> & {
  id: string | null
  seq: number | null
  status: MessageStatus
}

// GET /rooms/:roomId/messages
export type MessagesPage = { messages: ChatMessage[]; lastSeq: number }
