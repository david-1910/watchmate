import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '../../../shared/ui'
import { createRoom, getRoom } from '../../../shared/api'

function HomePage() {
  const [roomCode, setRoomCode] = useState('')
  const navigate = useNavigate()

  const handleCreateRoom = async () => {
    const room = await createRoom()
    // Сохраняем токен хоста для этой комнаты
    sessionStorage.setItem(`hostToken_${room.id}`, room.hostToken)
    navigate(`/room/${room.id}`)
  }

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) return

    const room = await getRoom(roomCode)
    if (room) {
      navigate(`/room/${room.id}`)
    } else {
      alert('Комната не найдена')
    }
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-animated-gradient">
      <div className="glass-card rounded-3xl p-12 flex flex-col items-center">
        <img src="/logo-watchmate.png" alt="WatchMate" className="h-20 w-20 object-contain mb-4" />
        <h1 className="text-5xl font-bold text-white mb-2 text-glow">
          WatchMate
        </h1>
        <p className="text-gray-300 mb-10">Смотри вместе с друзьями</p>

        <div className="flex flex-col gap-6 w-full">
          <Button onClick={handleCreateRoom}>Создать комнату</Button>
        </div>

        <div className="flex items-center gap-4 my-6 w-full">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent" />
          <span className="text-gray-400 text-sm">или</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent" />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <Input
            placeholder="Введите код комнаты"
            value={roomCode}
            onChange={setRoomCode}
          />
          <Button variant="secondary" onClick={handleJoinRoom}>
            Войти
          </Button>
        </div>
      </div>
    </div>
  )
}

export { HomePage }
