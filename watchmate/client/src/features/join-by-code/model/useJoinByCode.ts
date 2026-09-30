import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_ERROR_CODE, getErrorMessage, isApiError } from '@/shared/api'
import {
  getRoomByCode,
  normalizeJoinCode,
  formatJoinCode,
  roomPath,
  JOIN_CODE_LENGTH,
} from '@/entities/room'

// CONTRACT.md, раздел 7 «Join by code»: GET /rooms/by-code/:code → /room/{id}
export const useJoinByCode = () => {
  const navigate = useNavigate()
  const [code, setCodeState] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Поле всегда показывает код в виде XXX-XXX
  const setCode = (input: string) => setCodeState(formatJoinCode(input))

  const submit = async () => {
    const normalized = normalizeJoinCode(code)
    if (normalized.length !== JOIN_CODE_LENGTH) {
      setError('Введите код из 6 символов')
      return
    }

    setLoading(true)
    setError('')
    try {
      const room = await getRoomByCode(normalized)
      navigate(roomPath(room.id))
    } catch (err) {
      setError(
        isApiError(err, API_ERROR_CODE.NOT_FOUND)
          ? 'Комната не найдена'
          : getErrorMessage(err, 'Ошибка подключения')
      )
    } finally {
      setLoading(false)
    }
  }

  return { code, setCode, error, loading, submit }
}
