import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMemberToken, useRoomInfo, parseRoomSlug } from '@/entities/room'
import { JoinRoomForm } from '@/features/join-room'
import { RoomLoading } from './RoomLoading'
import { RoomNotFound } from './RoomNotFound'
import { RoomSession } from './RoomSession'

// Открытие /room/:roomId по CONTRACT.md, раздел 7:
// GET /rooms/:roomId → форма входа без memberToken → комната с сокетом
const RoomGate = ({ roomId }: { roomId: string }) => {
  const navigate = useNavigate()
  const info = useRoomInfo(roomId)
  const memberToken = useMemberToken(roomId)
  const [roomDeleted, setRoomDeleted] = useState(false)

  if (info.status === 'loading') return <RoomLoading />
  if (info.status === 'not-found' || roomDeleted) return <RoomNotFound />
  if (info.status === 'error') {
    return (
      <RoomNotFound
        title="Нет соединения"
        description="Не удалось связаться с сервером. Попробуйте позже"
      />
    )
  }

  if (!memberToken) {
    return (
      <JoinRoomForm
        roomId={roomId}
        isPrivate={info.room.isPrivate}
        onBack={() => navigate('/')}
      />
    )
  }

  return (
    <RoomSession
      roomId={roomId}
      onSessionEnded={(reason) => {
        if (reason === 'room-deleted') setRoomDeleted(true)
      }}
    />
  )
}

function RoomPage() {
  const { roomSlug } = useParams<{ roomSlug: string }>()
  const roomId = parseRoomSlug(roomSlug)
  if (!roomId) return <RoomNotFound />
  // key — при смене комнаты всё состояние создаётся заново
  return <RoomGate key={roomId} roomId={roomId} />
}

export { RoomPage }
