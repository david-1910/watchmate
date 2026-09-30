import { useState, useCallback, useEffect } from 'react'
import { useSocketEvent } from '@/shared/lib'
import { SOCKET_EVENTS } from '@/shared/config'
import { regenerateJoinCode, type RoomSnapshot } from '@/entities/room'

// Код для входа вручную: из snapshot, room-update и ответа POST /code
export const useRoomCode = (roomId: string, snapshot: RoomSnapshot | null) => {
  const [joinCode, setJoinCode] = useState('')
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    if (snapshot) setJoinCode(snapshot.room.joinCode)
  }, [snapshot])

  const onRoomUpdate = useCallback(
    (data: { joinCode: string }) => setJoinCode(data.joinCode),
    []
  )
  useSocketEvent(SOCKET_EVENTS.ROOM_UPDATE, onRoomUpdate)

  const regenerate = async () => {
    setRegenerating(true)
    try {
      const result = await regenerateJoinCode(roomId)
      setJoinCode(result.joinCode)
    } catch {
      // Код не изменился — показываем прежний
    } finally {
      setRegenerating(false)
    }
  }

  return { joinCode, regenerate, regenerating }
}
