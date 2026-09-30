import { useNavigate } from 'react-router-dom'
import { disconnectSocket } from '@/shared/api'
import { leaveRoom, session } from '@/entities/room'

// CONTRACT.md, раздел 7 «Leaving»: DELETE /members/me, затем сброс токенов,
// отключение сокета и переход на главную
export const useLeaveRoom = (roomId: string) => {
  const navigate = useNavigate()

  return async () => {
    try {
      await leaveRoom(roomId)
    } catch {
      // Выходим в любом случае: без сокета сервер сам удалит участника по таймауту
    }
    session.clearMemberToken(roomId)
    session.clearHostToken(roomId)
    disconnectSocket()
    navigate('/')
  }
}
