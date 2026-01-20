import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { connectSocket, disconnectSocket } from '../../../shared/api'
import { Button, Input } from '../../../shared/ui'

type Message = {
  userId: string
  userName: string
  message: string
  timestamp: Date
}

type User = {
  userId: string
  userName: string
}

type Reaction = {
  id: number
  userName: string
  emoji: string
}

function RoomPage() {
  const { id } = useParams()
  const [users, setUsers] = useState<User[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [userName, setUserName] = useState('')
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    if (!joined || !id) return

    const socket = connectSocket()

    socket.emit('join-room', { roomId: id, userName })
    socket.on('chat-message', (message: Message) => {
      setMessages((prev) => [...prev, message])
    })
    socket.on('user-joined', (data: { userId: string; userName: string }) => {
      console.log('Присоединился:', data.userName)
    })
    socket.on('countdown', (count: number) => {
      setCountdown(count)
      if (count === 0) {
        setTimeout(() => setCountdown(null), 1500)
      }
    })

    socket.on('users-update', (usersList: User[]) => {
      setUsers(usersList)
    })

    socket.on(
      'reaction',
      (data: { userId: string; userName: string; emoji: string }) => {
        const newReaction: Reaction = {
          id: Date.now(),
          userName: data.userName,
          emoji: data.emoji,
        }
        setReactions((prev) => [...prev, newReaction])

        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== newReaction.id))
        }, 2000)
      }
    )

    return () => {
      disconnectSocket()
    }
  }, [id, joined, userName])

  const sendMessage = () => {
    if (!newMessage.trim() || !id) return

    const socket = connectSocket()
    socket.emit('chat-message', { roomId: id, message: newMessage })
    setNewMessage('')
  }

  const startCountdown = () => {
    if (!id) return
    const socket = connectSocket()
    socket.emit('start-countdown', id)
  }

  const copyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('Ссылка скопирована!')
  }

  const handleJoin = () => {
    if (!userName.trim()) return
    setJoined(true)
  }

  const sendReaction = (emoji: string) => {
    if (!id) return
    const socket = connectSocket()
    socket.emit('reaction', { roomId: id, emoji })
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-2">WatchMate</h1>
        <p className="text-gray-400 mb-8">Комната: {id}</p>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Введи своё имя"
            value={userName}
            onChange={setUserName}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <Button onClick={handleJoin}>Войти в комнату</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">WatchMate</h1>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Комната:</span>
          <code className="bg-gray-800 px-3 py-1 rounded">{id}</code>
          <Button onClick={copyLink}>Копировать</Button>
        </div>
      </header>

      <main className="flex gap-8">
        <div className="flex-1">
          <div
            className="bg-gray-800 rounded-lg aspect-video flex flex-col items-center justify-center relative
  overflow-hidden"
          >
            {/* Всплывающие реакции */}
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute animate-bounce text-6xl"
                style={{
                  left: `${Math.random() * 80 + 10}%`,
                  top: `${Math.random() * 60 + 20}%`,
                }}
              >
                {r.emoji}
              </div>
            ))}

            {countdown !== null ? (
              <div className="text-9xl font-bold text-purple-500">
                {countdown === 0 ? '▶️' : countdown}
              </div>
            ) : (
              <>
                <p className="text-gray-500 mb-4">Готовы смотреть?</p>
                <Button onClick={startCountdown}>Старт 3-2-1</Button>
              </>
            )}
          </div>
          {/* Панель реакций */}
          <div className="flex justify-center gap-4 mt-4">
            {['👍', '👎', '😁', '😒', '🔥', '❤️', '😍', '🤦‍♂️' ].map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-3xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <aside className="w-80 bg-gray-800 rounded-lg p-4 flex flex-col">
          <h2 className="font-semibold mb-4">Участники ({users.length})</h2>
          <div className="flex flex-wrap gap-2">
            {users.map((user) => (
              <span
                key={user.userId}
                className="bg-purple-600 px-2 py-1 rounded text-sm"
              >
                {user.userName}
              </span>
            ))}
          </div>
          <h2 className="font-semibold mb-4 mt-4">Чат</h2>
          <div className="flex-1 overflow-y-auto mb-4 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className="bg-gray-700 rounded p-2">
                <span className="text-sm text-purple-400 font-semibold">
                  {msg.userName}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({msg.userId?.slice(0, 4)})
                </span>
                <p>{msg.message}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Сообщение..."
              value={newMessage}
              onChange={setNewMessage}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage}>→</Button>
          </div>
        </aside>
      </main>
    </div>
  )
}

export { RoomPage }
