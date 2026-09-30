import { useCallback, useSyncExternalStore } from 'react'
import { session } from './session'

// Текущий memberToken комнаты; компонент перерисуется, когда токен выдадут или сбросят
export const useMemberToken = (roomId: string): string | null => {
  const getSnapshot = useCallback(() => session.getMemberToken(roomId), [roomId])
  return useSyncExternalStore(session.subscribe, getSnapshot)
}
