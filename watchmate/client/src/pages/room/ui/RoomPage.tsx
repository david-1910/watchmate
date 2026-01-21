import { useParams, useNavigate } from 'react-router-dom'
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
  direction: 'left' | 'right'
  duration: number
  zIndex: number
}

function RoomPage() {
  const { id } = useParams()
  const navigate = useNavigate()
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
  const [hostId, setHostId] = useState<string | null>(null)
  const [mySocketId, setMySocketId] = useState<string | null>(null)
  const [showExitModal, setShowExitModal] = useState(false)

  const isHost = mySocketId === hostId

  const handleExit = () => {
    disconnectSocket()
    navigate('/')
  }

  useEffect(() => {
    if (!joined || !id) return
    const socket = connectSocket()

    const onConnect = () => {
      console.log('Socket connected:', socket.id)
      setMySocketId(socket.id || null)
      // Получаем токен хоста если мы создатель комнаты
      const hostToken = sessionStorage.getItem(`hostToken_${id}`)
      socket.emit('join-room', { roomId: id, userName, hostToken })
    }

    if (socket.connected) {
      onConnect()
    } else {
      socket.once('connect', onConnect)
    }

    socket.on('chat-message', (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    socket.on('host-update', (newHostId: string) => {
      console.log('Host update:', newHostId, 'My ID:', socket.id)
      setHostId(newHostId)
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
        const directions: ('left' | 'right')[] = ['left', 'right']
        const newReaction: Reaction = {
          id: performance.now() + Math.random() * 10000,
          userName: data.userName,
          emoji: data.emoji,
          left: Math.random() * 70 + 15,
          direction: directions[Math.floor(Math.random() * 2)],
          duration: 1.2 + Math.random() * 0.2,
          zIndex: Math.floor(Math.random() * 100),
        }
        requestAnimationFrame(() => {
          setReactions((prev) => [...prev, newReaction])
        })

        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== newReaction.id))
        }, 1700)
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
      <div className="min-h-screen bg-animated-gradient text-white flex flex-col items-center justify-center">
        <div className="glass-card rounded-3xl p-10 flex flex-col items-center">
          <img src="/logo-watchmate.png" alt="WatchMate" className="h-16 w-16 object-contain mb-3" />
          <h1 className="text-4xl font-bold mb-2 text-glow">WatchMate</h1>
          <p className="text-gray-300 mb-8">
            Комната: <code className="glass px-3 py-1 rounded-lg ml-1">{id}</code>
          </p>
          <div className="flex flex-col gap-4 w-full">
            <Input
              placeholder="Введи своё имя"
              value={userName}
              onChange={setUserName}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <Button onClick={handleJoin}>Войти в комнату</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-animated-gradient text-white p-6 flex flex-col overflow-hidden">
      <header className="glass rounded-2xl px-6 py-3 flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo-watchmate.png" alt="WatchMate" className="h-10 w-10 object-contain" />
          <h1 className="text-2xl font-bold text-glow">WatchMate</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-300">Комната:</span>
          <code className="glass px-3 py-1 rounded-lg font-mono">{id}</code>
          <Button onClick={copyLink}>Копировать</Button>
          <button
            onClick={() => setShowExitModal(true)}
            className="glass-button-secondary px-4 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div
            className="glass-card rounded-2xl flex-1 flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Всплывающие реакции */}
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute text-3xl pointer-events-none"
                style={{
                  left: `${r.left}%`,
                  bottom: '10px',
                  zIndex: r.zIndex,
                  willChange: 'transform, opacity',
                  animation: `float-up-${r.direction} ${r.duration}s ease-out forwards`,
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
                {isHost && (
                  <button
                    onClick={() => {
                      setLocalVideo(null)
                      setIsPlaying(false)
                    }}
                    className="absolute top-3 right-3 glass-button-secondary px-3 py-1 rounded-lg text-sm z-10 hover:bg-red-500/50"
                  >
                    ✕ Закрыть
                  </button>
                )}

                {/* Оверлей "Все готовы?" */}
                {!isPlaying && (
                  <div className="absolute inset-0 glass-dark flex flex-col items-center justify-center gap-4">
                    <p className="text-2xl font-bold text-glow">Все готовы?</p>
                    <p className="text-gray-300">
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

                {isHost && (
                  <button
                    onClick={clearVideo}
                    className="absolute top-3 right-3 glass-button-secondary px-3 py-1 rounded-lg text-sm z-10 hover:bg-red-500/50"
                  >
                    ✕ Закрыть
                  </button>
                )}

                {/* Оверлей "Все готовы?" */}
                {!isPlaying && (
                  <div className="absolute inset-0 glass-dark flex flex-col items-center justify-center gap-4">
                    <p className="text-2xl font-bold text-glow">Все готовы?</p>
                    <p className="text-gray-300">
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
              <div className="flex flex-col items-center gap-4 p-8">
                {isHost ? (
                  <>
                    <p className="text-gray-300">
                      Вставьте ссылку или загрузите файл
                    </p>
                    <Input
                      placeholder="Любая ссылка..."
                      value={inputUrl}
                      onChange={setInputUrl}
                    />
                    <div className="flex gap-3">
                      <Button onClick={() => shareVideo(inputUrl)}>
                        Открыть ссылку
                      </Button>
                      <label className="glass-button-secondary px-5 py-3 rounded-xl cursor-pointer flex items-center gap-2 hover:bg-white/15 transition-all">
                        Загрузить файл
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400">Ожидание видео от хоста...</p>
                )}
              </div>
            )}

            {countdown !== null && (
              <div className="absolute inset-0 glass-dark flex items-center justify-center">
                <span className="text-9xl font-bold text-glow">
                  {countdown === 0 ? '▶️' : countdown}
                </span>
              </div>
            )}
          </div>
          {/* Панель реакций */}
          <div className="glass rounded-2xl mt-4 py-3 px-6 flex justify-center gap-4 shrink-0">
            {['👍', '👎', '😁', '😒', '🔥', '❤️', '😍', '🤦‍♂️'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-3xl hover:scale-125 transition-transform hover:drop-shadow-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <aside className="w-80 glass-card rounded-2xl p-5 flex flex-col min-h-0">
          <h2 className="font-semibold mb-4 text-gray-200 shrink-0">Участники ({users.length})</h2>
          <div className="flex flex-wrap gap-2 shrink-0">
            {users.map((user) => (
              <span
                key={user.userId}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  readyUsers.includes(user.userId)
                    ? 'bg-green-500/30 border border-green-500/50'
                    : user.userId === hostId
                    ? 'bg-yellow-500/30 border border-yellow-500/50'
                    : 'glass'
                }`}
              >
                {user.userId === hostId && '👑 '}
                {readyUsers.includes(user.userId) && '✓ '}
                {user.userName}
              </span>
            ))}
          </div>
          <h2 className="font-semibold mb-3 mt-6 text-gray-200 shrink-0">Чат</h2>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0 mb-3">
            {messages.map((msg, i) => (
              <div key={i} className="glass rounded-xl p-3">
                <span className="text-sm text-purple-400 font-semibold">
                  {msg.userName}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({msg.userId?.slice(0, 4)})
                </span>
                <p className="mt-1 text-gray-200">{msg.message}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 shrink-0">
            <div className="flex-1">
              <Input
                placeholder="Сообщение..."
                value={newMessage}
                onChange={setNewMessage}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
            </div>
            <Button onClick={sendMessage}>→</Button>
          </div>
        </aside>
      </main>

      {/* Модальное окно выхода */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExitModal(false)}
          />
          <div className="glass-card rounded-2xl p-8 z-10 flex flex-col items-center gap-6 max-w-sm">
            <h2 className="text-xl font-bold text-glow">Выйти из комнаты?</h2>
            <p className="text-gray-300 text-center">
              Вы уверены, что хотите покинуть комнату?
            </p>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setShowExitModal(false)}>
                Отмена
              </Button>
              <button
                onClick={handleExit}
                className="px-6 py-3 rounded-xl font-semibold bg-red-500/80 hover:bg-red-500 border border-red-400/50 transition-all"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { RoomPage }
