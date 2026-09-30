import { useState, useEffect, useRef } from 'react'
import { playChatSound } from '@/shared/lib'
import type { DisplayMessage } from '@/entities/message'

// Счётчик непрочитанных и звук при новом сообщении от другого участника
export const useChatUnread = (
  messages: DisplayMessage[],
  myUserId: string | null,
  chatIsActive: boolean
): number => {
  const [seenCount, setSeenCount] = useState(0)

  // Сбрасываем счётчик при открытии чата
  useEffect(() => {
    if (chatIsActive) setSeenCount(messages.length)
  }, [chatIsActive, messages.length])

  const prevLenRef = useRef(0)
  useEffect(() => {
    const len = messages.length
    if (len > prevLenRef.current) {
      const last = messages[len - 1]
      if (last && last.userId !== myUserId) playChatSound()
    }
    prevLenRef.current = len
  }, [messages.length, myUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Бейдж = сообщения от других с момента последнего просмотра чата
  return messages.slice(seenCount).filter((m) => m.userId !== myUserId).length
}
