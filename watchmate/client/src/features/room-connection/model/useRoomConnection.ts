import { useState, useCallback, useEffect } from 'react'
import { connectSocket, disconnectSocket } from '../../../shared/api'
import { useSocketEvent } from '../../../shared/lib'
import { SOCKET_EVENTS } from '../../../shared/config'
import type { RoomUser } from '../../../shared/types'
import { session } from '../../../entities/room'

type ConnectionState = {
  users: RoomUser[]
  hostId: string | null
  mySocketId: string | null
}

export const useRoomConnection = (
  roomId: string | undefined,
  userName: string,
  joined: boolean
): ConnectionState => {
  const [users, setUsers] = useState<RoomUser[]>([])
  const [hostId, setHostId] = useState<string | null>(null)
  const [mySocketId, setMySocketId] = useState<string | null>(null)

  useEffect(() => {
    if (!joined || !roomId) return

    const socket = connectSocket()

    const onConnect = () => {
      setMySocketId(socket.id ?? null)
      const hostToken = session.getHostToken(roomId)
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, userName, hostToken })
    }

    if (socket.connected) {
      onConnect()
    } else {
      socket.once('connect', onConnect)
    }

    return () => {
      socket.off('connect', onConnect)
      disconnectSocket()
    }
  }, [roomId, joined, userName])

  const onUsersUpdate = useCallback((list: RoomUser[]) => setUsers(list), [])
  const onHostUpdate = useCallback((id: string) => setHostId(id), [])

  useSocketEvent<RoomUser[]>(SOCKET_EVENTS.USERS_UPDATE, onUsersUpdate, joined && !!roomId)
  useSocketEvent<string>(SOCKET_EVENTS.HOST_UPDATE, onHostUpdate, joined && !!roomId)

  return { users, hostId, mySocketId }
}
