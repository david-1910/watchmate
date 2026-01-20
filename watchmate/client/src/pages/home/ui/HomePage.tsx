import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '../../../shared/ui'
import { createRoom, getRoom } from '../../../shared/api'

function HomePage() {
  const [roomCode, setRoomCode] = useState('')
  const navigate = useNavigate()

  const handleCreateRoom = async () => {
    const room = await createRoom()
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <h1 className="text-5xl font-bold text-white mb-2">WatchMate</h1>
      <p className="text-gray-400 mb-12">Смотри вместе с друзьями</p>

      <div className="flex flex-col gap-8">
        <Button onClick={handleCreateRoom}>Создать комнату</Button>
      </div>

      <div className="flex items-center gap-4 my-6">
        <span className="text-gray-500">— или —</span>
      </div>

      <div className="flex flex-col gap-3">
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
  )
}

export { HomePage }
