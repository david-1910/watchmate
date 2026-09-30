import { useState } from 'react'
import { API_ERROR_CODE, getErrorMessage, isApiError } from '@/shared/api'
import { joinRoom, session } from '@/entities/room'

// CONTRACT.md, раздел 7 «Open /room/:roomId», шаг 2: POST /members с именем
// (и паролем для приватной комнаты). Полученный memberToken открывает комнату
export const useJoinRoom = (roomId: string, isPrivate: boolean) => {
  const [userName, setUserName] = useState(session.getUserName() ?? '')
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
      setError('Введите пароль')
      return
    }
    if (loading) return

    setLoading(true)
    setError('')
    try {
      const member = await joinRoom(roomId, {
        userName: name,
        password: isPrivate ? password.trim() : undefined,
      })
      session.setUserName(name)
      session.setMemberToken(roomId, member.memberToken)
    } catch (err) {
      setError(
        isApiError(err, API_ERROR_CODE.WRONG_PASSWORD)
          ? 'Неверный пароль'
          : getErrorMessage(err, 'Ошибка подключения')
      )
    } finally {
      setLoading(false)
    }
  }

  return { userName, setUserName, password, setPassword, error, loading, submit }
}
