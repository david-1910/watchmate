import type { ChatMessage, DisplayMessage } from '@/entities/message'

// Отправленные — по seq, неотправленные — в конце в порядке добавления
const compareMessages = (a: DisplayMessage, b: DisplayMessage): number => {
  if (a.seq === null && b.seq === null) return 0
  if (a.seq === null) return 1
  if (b.seq === null) return -1
  return a.seq - b.seq
}

// Слияние сообщений сервера с лентой без дублей: совпадение по id или clientId
// заменяет существующую запись (так pending превращается в sent)
export const mergeMessages = (
  list: DisplayMessage[],
  incoming: ChatMessage[]
): DisplayMessage[] => {
  const next = [...list]
  for (const msg of incoming) {
    const entry: DisplayMessage = { ...msg, status: 'sent' }
    const index = next.findIndex(
      (m) => m.id === msg.id || m.clientId === msg.clientId
    )
    if (index >= 0) next[index] = entry
    else next.push(entry)
  }
  return next.sort(compareMessages)
}
