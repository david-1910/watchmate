import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/shared/api'
import { createRoom, joinRoom, session, roomPath } from '@/entities/room'

// CONTRACT.md, раздел 7 «Create a room»:
// POST /rooms → hostToken → POST /members с hostToken → memberToken → /room/{id}
export const useCreateRoom = () => {
  const navigate = useNavigate()
  const [userName, setUserName] = useState(session.getUserName() ?? '')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const name = userName.trim()
    if (!name) {
      setError('Введите ваше имя')
      return
    }
    if (isPrivate && !password.trim()) {
      setError('Введите пароль для приватной комнаты')
      return
    }

    setLoading(true)
    setError('')
    try {
      const room = await createRoom({
        isPrivate,
        password: isPrivate ? password.trim() : undefined,
      })
      session.setHostToken(room.id, room.hostToken)
      const member = await joinRoom(room.id, { userName: name, hostToken: room.hostToken })
      session.setMemberToken(room.id, member.memberToken)
      session.setUserName(name)
      navigate(roomPath(room.id))
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось создать комнату'))
    } finally {
      setLoading(false)
    }
  }

  return {
    userName, setUserName,
    isPrivate, setIsPrivate,
    password, setPassword,
    error, loading, submit,
  }
}
