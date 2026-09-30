import { state } from '../state/state'
import { generateId } from '../../shared/utils/generators'
import { MAX_MESSAGES } from '../../shared/constants/limits'
import { ChatLog, ChatMessage } from '../../shared/types'

type PostParams = { clientId: string; message: string; userId: string; userName: string }
type PostResult = { message: ChatMessage; created: boolean }

const getLog = (roomId: string): ChatLog => {
  const log = state.roomMessages.get(roomId) ?? { messages: [], lastSeq: 0 }
  state.roomMessages.set(roomId, log)
  return log
}

const getLastSeq = (roomId: string): number => state.roomMessages.get(roomId)?.lastSeq ?? 0

// Сообщения с seq > afterSeq, от старых к новым
const getMessages = (roomId: string, afterSeq: number): { messages: ChatMessage[]; lastSeq: number } => {
  const log = state.roomMessages.get(roomId)
  return {
    messages: log?.messages.filter((m) => m.seq > afterSeq) ?? [],
    lastSeq: log?.lastSeq ?? 0,
  }
}

// Идемпотентно по clientId: повтор возвращает уже сохранённое сообщение
const post = (roomId: string, { clientId, message, userId, userName }: PostParams): PostResult => {
  const log = getLog(roomId)
  const existing = log.messages.find((m) => m.clientId === clientId)
  if (existing) return { message: existing, created: false }

  const stored: ChatMessage = {
    id: generateId(),
    clientId,
    seq: log.lastSeq + 1,
    userId,
    userName,
    message: message.trim(),
    timestamp: new Date().toISOString(),
  }
  log.messages.push(stored)
  log.lastSeq = stored.seq
  if (log.messages.length > MAX_MESSAGES) log.messages.shift()
  return { message: stored, created: true }
}

export const chatService = { getMessages, getLastSeq, post }
