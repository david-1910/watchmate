import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom, getRoom, verifyRoomPassword } from '../../../shared/api'
import { session } from '../../../entities/room'

type ModalTab = 'create' | 'join'

export const useRoomModal = () => {
  const navigate = useNavigate()

  const [showModal, setShowModal] = useState(false)
  const [modalTab, setModalTab] = useState<ModalTab>('create')
  const [userName, setUserName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [roomPassword, setRoomPassword] = useState('')
  const [joinRoomIsPrivate, setJoinRoomIsPrivate] = useState<boolean | null>(null)
  const [joinPassword, setJoinPassword] = useState('')

  const resetJoinState = () => {
    setJoinRoomIsPrivate(null)
    setJoinPassword('')
    setError('')
  }

  const openModal = (tab: ModalTab) => {
    setModalTab(tab)
    setShowModal(true)
    resetJoinState()
  }

  const setTab = (tab: ModalTab) => {
    setModalTab(tab)
    resetJoinState()
  }

  const handleCreateRoom = async () => {
    if (!userName.trim()) { setError('Введите ваше имя'); return }
    if (isPrivate && !roomPassword.trim()) { setError('Введите пароль для приватной комнаты'); return }

    setLoading(true)
    setError('')
    try {
      const room = await createRoom({ isPrivate, password: isPrivate ? roomPassword.trim() : undefined })
      session.setHostToken(room.id, room.hostToken)
      session.setUserName(userName.trim())
      navigate(`/room/${room.id}`)
    } catch {
      setError('Не удалось создать комнату')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!userName.trim()) { setError('Введите ваше имя'); return }
    if (!roomCode.trim()) { setError('Введите код комнаты'); return }

    setLoading(true)
    setError('')
    try {
      const room = await getRoom(roomCode.trim().toUpperCase())
      if (!room) { setError('Комната не найдена'); setJoinRoomIsPrivate(null); return }

      if (room.isPrivate && joinRoomIsPrivate === null) {
        setJoinRoomIsPrivate(true)
        return
      }

      if (room.isPrivate) {
        if (!joinPassword.trim()) { setError('Введите пароль'); return }
        const ok = await verifyRoomPassword(room.id, joinPassword.trim())
        if (!ok) { setError('Неверный пароль'); return }
        session.setPasswordVerified(room.id)
      }

      session.setUserName(userName.trim())
      navigate(`/room/${room.id}`)
    } catch {
      setError('Ошибка подключения')
    } finally {
      setLoading(false)
    }
  }

  return {
    showModal, setShowModal, modalTab, setTab, openModal,
    userName, setUserName, roomCode, setRoomCode,
    error, loading, isPrivate, setIsPrivate, roomPassword, setRoomPassword,
    joinRoomIsPrivate, joinPassword, setJoinPassword,
    handleCreateRoom, handleJoinRoom, resetJoinState,
  }
}
