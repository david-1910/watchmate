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
  left: number
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
  const [inputUrl, setInputUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [localVideo, setLocalVideo] = useState<string | null>(null)
  const [readyUsers, setReadyUsers] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)

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
        setTimeout(() => {
          setCountdown(null)
          setIsPlaying(true)
        }, 1500)
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
          left: Math.random() * 80 + 10,
        }
        setReactions((prev) => [...prev, newReaction])

        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== newReaction.id))
        }, 2000)
      }
    )

    socket.on('video-update', (url: string) => {
      setVideoUrl(url)
      setLocalVideo(null)
      setIsPlaying(false)
    })

    socket.on(
      'ready-update',
      (data: { readyUsers: string[]; allReady: boolean }) => {
        setReadyUsers(data.readyUsers)
      }
    )

    return () => {
      disconnectSocket()
    }
  }, [id, joined, userName])

  const shareVideo = (url: string) => {
    if (!id || !url.trim()) return
    const socket = connectSocket()
    socket.emit('share-video', { roomId: id, videoUrl: url.trim() })
    setInputUrl('')
  }

  const clearVideo = () => {
    if (!id) return
    const socket = connectSocket()
    socket.emit('clear-video', id)
    setIsPlaying(false)
  }

  const toggleReady = () => {
    if (!id) return
    if (!videoUrl && !localVideo) return
    const socket = connectSocket()
    socket.emit('toggle-ready', id)
  }

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

  const getEmbedUrl = (url: string, autoplay: boolean = false): string => {
    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
    )
    if (youtubeMatch) {
      const autoplayParam = autoplay ? '?autoplay=1' : ''
      return `https://www.youtube.com/embed/${youtubeMatch[1]}${autoplayParam}`
    }
    return url
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setLocalVideo(url)
      setVideoUrl('')
    }
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
                className="absolute text-5xl pointer-events-none"
                style={{
                  left: `${r.left}%`,
                  bottom: '10px',
                  animation: 'float-up 2s ease-out forwards',
                }}
              >
                {r.emoji}
              </div>
            ))}

            {localVideo ? (
              <>
                <video
                  src={localVideo}
                  width="100%"
                  height="100%"
                  controls
                  className="rounded-lg"
                />
                <button
                  onClick={() => {
                    setLocalVideo(null)
                    setIsPlaying(false)
                  }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm z-10"
                >
                  ✕ Закрыть
                </button>

                {/* Оверлей "Все готовы?" */}
                {!isPlaying && (
                  <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center gap-4">
                    <p className="text-2xl font-bold">Все готовы?</p>
                    <p className="text-gray-400">
                      {readyUsers.length}/{users.length} готовы
                    </p>
                    <Button onClick={toggleReady}>
                      {readyUsers.includes(
                        users.find((u) => u.userName === userName)?.userId || ''
                      )
                        ? '✓ Я готов!'
                        : 'Готов!'}
                    </Button>
                  </div>
                )}
              </>
            ) : videoUrl ? (
              <>
                <iframe
                  src={getEmbedUrl(videoUrl, isPlaying)}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />

                <button
                  onClick={clearVideo}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm z-10"
                >
                  ✕ Закрыть
                </button>

                {/* Оверлей "Все готовы?" */}
                {!isPlaying && (
                  <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center gap-4">
                    <p className="text-2xl font-bold">Все готовы?</p>
                    <p className="text-gray-400">
                      {readyUsers.length}/{users.length} готовы
                    </p>
                    <Button onClick={toggleReady}>
                      {readyUsers.includes(
                        users.find((u) => u.userName === userName)?.userId || ''
                      )
                        ? '✓ Я готов!'
                        : 'Готов!'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-gray-500">Вставь ссылку или загрузи файл</p>
                <Input
                  placeholder="Любая ссылка..."
                  value={inputUrl}
                  onChange={setInputUrl}
                />
                <div className="flex gap-2">
                  <Button onClick={() => shareVideo(inputUrl)}>
                    Открыть ссылку
                  </Button>
                  <label className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded cursor-pointer">
                    Загрузить файл
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {countdown !== null && (
              <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                <span className="text-9xl font-bold text-purple-500">
                  {countdown === 0 ? '▶️' : countdown}
                </span>
              </div>
            )}
          </div>
          {/* Панель реакций */}
          <div className="flex justify-center gap-4 mt-4">
            {['👍', '👎', '😁', '😒', '🔥', '❤️', '😍', '🤦‍♂️'].map((emoji) => (
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
                className={`px-2 py-1 rounded text-sm ${
                  readyUsers.includes(user.userId)
                    ? 'bg-green-600'
                    : 'bg-purple-600'
                }`}
              >
                {readyUsers.includes(user.userId) && '✓ '}
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
