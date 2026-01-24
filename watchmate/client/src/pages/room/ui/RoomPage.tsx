import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import {
  connectSocket,
  disconnectSocket,
  getRoom,
  verifyRoomPassword,
} from '../../../shared/api'
import { Button, Input } from '../../../shared/ui'
import { connect } from 'socket.io-client'

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

type QueueItem = {
  id: string
  url: string
  title: string
}

type Suggestion = {
  id: string
  url: string
  title: string
  suggestedBy: string
  suggestedById: string
}

function RoomPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Проверяем имя из sessionStorage (установлено на главной)
  const storedName = sessionStorage.getItem('userName')

  const [users, setUsers] = useState<User[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [userName, setUserName] = useState(storedName || '')
  const [joined, setJoined] = useState(!!storedName)
  const [inputUrl, setInputUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [localVideo, setLocalVideo] = useState<string | null>(null)
  const [localFileName, setLocalFileName] = useState<string | null>(null)
  const [hostFileName, setHostFileName] = useState<string | null>(null)
  const [readyUsers, setReadyUsers] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [hostId, setHostId] = useState<string | null>(null)
  const [mySocketId, setMySocketId] = useState<string | null>(null)
  const [showExitModal, setShowExitModal] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'users'>('chat')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [roomExists, setRoomExists] = useState<boolean | null>(null)
  const [isPrivateRoom, setIsPrivateRoom] = useState<boolean | null>(null)
  const [passwordVerified, setPasswordVerified] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [videoQueue, setVideoQueue] = useState<QueueItem[]>([])
  const [queueInput, setQueueInput] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestInput, setSuggestInput] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Проверка существования комнаты
  useEffect(() => {
    if (!id) return
    getRoom(id).then((room) => {
      if (room) {
        setRoomExists(true)
        setIsPrivateRoom(room.isPrivate)
        // Если создатель комнаты - пропускаем проверку пароля
        const hostToken = sessionStorage.getItem(`hostToken_${id}`)
        if (hostToken) {
          setPasswordVerified(true)
        } else if (!room.isPrivate) {
          setPasswordVerified(true)
        }
        // Если пользователь уже проверил пароль для этой комнаты (пришел с главной)
        else if (sessionStorage.getItem(`passwordVerified_${id}`)) {
          setPasswordVerified(true)
        }
      } else {
        setRoomExists(false)
        setIsPrivateRoom(false)
      }
    })
  }, [id])

  // Авто-скролл к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isHost = mySocketId === hostId

  // Генерация цвета аватара на основе имени
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-purple-500/40',
      'bg-blue-500/40',
      'bg-green-500/40',
      'bg-pink-500/40',
      'bg-orange-500/40',
      'bg-cyan-500/40',
      'bg-red-500/40',
      'bg-indigo-500/40',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const handleExit = () => {
    disconnectSocket()
    sessionStorage.removeItem('userName')
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

    socket.on('queue-update', (queue: QueueItem[]) => {
      setVideoQueue(queue)
    })

    socket.on('suggestions-update', (newSuggestions: Suggestion[]) => {
      setSuggestions(newSuggestions)
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
      setLocalFileName(null)
      setHostFileName(null)
      setIsPlaying(false)
    })

    socket.on('local-file-update', (fileName: string | null) => {
      setHostFileName(fileName)
      if (fileName) {
        setVideoUrl('')
      }
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
    setLocalVideo(null)
    setLocalFileName(null)
    setHostFileName(null)
    setIsPlaying(false)
  }

  const addToQueue = () => {
    if (!queueInput.trim() || !id) return
    const socket = connectSocket()
    socket.emit('queue-add', {
      roomId: id,
      url: queueInput.trim(),
      title: queueInput.trim(),
    })
    setQueueInput('')
  }

  const removeFromQueue = (itemId: string) => {
    if (!id) return
    const socket = connectSocket()
    socket.emit('queue-remove', { roomId: id, itemId })
  }

  const playFromQueue = (itemId: string) => {
    if (!id) return
    const socket = connectSocket()
    socket.emit('queue-play', { roomId: id, itemId })
  }

  const suggestVideo = () => {
    if (!suggestInput.trim() || !id) return
    const socket = connectSocket()
    socket.emit('suggest-video', {
      roomId: id,
      url: suggestInput.trim(),
      title: suggestInput.trim(),
    })
    setSuggestInput('')
  }

  const acceptSuggestion = (suggestionId: string) => {
    if (!id) return
    const socket = connectSocket()
    socket.emit('accept-suggestion', { roomId: id, suggestionId })
  }

  const rejectSuggestion = (suggestionId: string) => {
    if (!id) return
    const socket = connectSocket()
    socket.emit('reject-suggestion', { roomId: id, suggestionId })
  }

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    if (!id || fromIndex === toIndex) return 
    const socket = connectSocket()
    socket.emit('queue-reorder', { roomId: id, fromIndex, toIndex })
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

  const [copied, setCopied] = useState(false)

  const copyRoomCode = () => {
    if (!id) return
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoin = () => {
    if (!userName.trim()) return
    sessionStorage.setItem('userName', userName.trim())
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
    if (file && id) {
      const url = URL.createObjectURL(file)
      setLocalVideo(url)
      setLocalFileName(file.name)
      setVideoUrl('')
      // Только хост сообщает другим пользователям имя файла
      if (isHost) {
        const socket = connectSocket()
        socket.emit('share-local-file', { roomId: id, fileName: file.name })
      }
    }
  }

  // Загрузка - проверяем существование комнаты
  if (roomExists === null || isPrivateRoom === null) {
    return (
      <div className="min-h-screen bg-animated-gradient text-white flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    )
  }

  // Комната не найдена
  if (roomExists === false) {
    return (
      <div className="min-h-screen bg-animated-gradient text-white flex flex-col items-center justify-center">
        <div className="glass-card rounded-3xl p-10 flex flex-col items-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Комната не найдена</h1>
          <p className="text-gray-400 mb-6 text-center">
            Комната не существует или была закрыта
          </p>
          <Button onClick={() => navigate('/')}>На главную</Button>
        </div>
      </div>
    )
  }

  // Форма входа - если нет имени и нужен пароль (прямой переход по ссылке на приватную комнату)
  if (!joined) {
    const needsPassword = isPrivateRoom && !passwordVerified

    const handleJoinWithPassword = async () => {
      if (!userName.trim()) return

      if (needsPassword) {
        if (!passwordInput.trim()) {
          setPasswordError('Введите пароль')
          return
        }
        const success = await verifyRoomPassword(id!, passwordInput.trim())
        if (!success) {
          setPasswordError('Неверный пароль')
          return
        }
        // Сохраняем факт проверки пароля для этой комнаты
        sessionStorage.setItem(`passwordVerified_${id}`, 'true')
        setPasswordVerified(true)
      }

      sessionStorage.setItem('userName', userName.trim())
      setJoined(true)
    }

    return (
      <div className="min-h-screen bg-animated-gradient text-white flex flex-col items-center justify-center relative">
        {/* Кнопка назад */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 flex items-center gap-2 glass px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Назад
        </button>

        <div className="glass-card rounded-3xl p-10 flex flex-col items-center">
          <img
            src="/logo-watchmate.png"
            alt="WatchMate"
            className="h-16 w-16 object-contain mb-3"
          />
          <h1 className="text-4xl font-bold mb-2 text-glow">WatchMate</h1>
          <p className={`text-gray-300 ${needsPassword ? 'mb-2' : 'mb-8'}`}>
            Комната:{' '}
            <code className="glass px-3 py-1 rounded-lg ml-1">{id}</code>
          </p>
          {needsPassword && (
            <p className="text-purple-400 text-sm mb-6">🔒 Приватная комната</p>
          )}
          <div className="flex flex-col gap-4 w-full min-w-[280px]">
            <Input
              placeholder="Введи своё имя"
              value={userName}
              onChange={setUserName}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinWithPassword()}
            />
            {needsPassword && (
              <Input
                placeholder="Пароль комнаты"
                value={passwordInput}
                onChange={setPasswordInput}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinWithPassword()}
              />
            )}
            {passwordError && (
              <p className="text-red-400 text-sm text-center">
                {passwordError}
              </p>
            )}
            <Button onClick={handleJoinWithPassword}>Войти в комнату</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-animated-gradient text-white p-6 flex flex-col overflow-hidden">
      <header className="glass rounded-2xl px-6 py-3 flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExitModal(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl glass hover:bg-white/10 transition-all"
            title="Назад"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <img
            src="/logo-watchmate.png"
            alt="WatchMate"
            className="h-10 w-10 object-contain"
          />
          <h1 className="text-2xl font-bold text-glow">WatchMate</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Компактный список участников */}
          <div className="hidden sm:flex items-center">
            <div className="flex -space-x-2">
              {users.slice(0, 3).map((user) => (
                <div
                  key={user.userId}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-gray-900 ${
                    user.userId === hostId
                      ? 'bg-yellow-500/50'
                      : getAvatarColor(user.userName)
                  }`}
                  title={user.userName}
                >
                  {user.userId === hostId
                    ? '👑'
                    : user.userName.charAt(0).toUpperCase()}
                </div>
              ))}
              {users.length > 3 && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-600 border-2 border-gray-900">
                  +{users.length - 3}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={copyRoomCode}
            className="hidden md:flex items-center gap-2 glass px-3 py-2 rounded-xl hover:bg-white/10 transition-all group"
            title="Нажмите чтобы скопировать"
          >
            {isPrivateRoom && (
              <svg
                className="w-4 h-4 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            )}
            <span className="text-gray-400 text-sm">Комната:</span>
            <code className="font-mono text-sm text-white group-hover:text-purple-300 transition-colors">
              {id}
            </code>
            {copied ? (
              <svg
                className="w-4 h-4 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-gray-400 group-hover:text-purple-300 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="flex gap-4 flex-1 min-h-0">
        {isHost && (
          <aside className="w-64 glass-card rounded-2xl p-4 flex flex-col min-h-0">
            <h3 className="text-lg font-bold mb-3">Очередь</h3>

            {/* Добавление видео */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="YouTube URL..."
                value={queueInput}
                onChange={(e) => setQueueInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addToQueue()}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
  placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
              <button
                onClick={addToQueue}
                className="px-3 py-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-sm transition-colors"
              >
                +
              </button>
            </div>

            {/* Список очереди */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {videoQueue.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  Очередь пуста
                </p>
              ) : (
                videoQueue.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOverIndex(index)
                    }}
                    onDragEnd={() => {
                      if (draggedIndex !== null && dragOverIndex !== null) {
                        reorderQueue(draggedIndex, dragOverIndex)
                      }
                      setDraggedIndex(null)
                      setDragOverIndex(null)
                    }}
                    className={`glass rounded-lg p-2 flex items-center gap-2 cursor-grab ${
                      dragOverIndex === index
                        ? 'border-2 border-purple-500'
                        : ''
                    }`}
                  >
                    <span className="text-purple-400 text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm truncate">
                      {item.title}
                    </span>
                    <button
                      onClick={() => playFromQueue(item.id)}
                      className="p-1 hover:bg-green-500/30 rounded text-green-400"
                      title="Воспроизвести"
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="p-1 hover:bg-red-500/30 rounded text-red-400"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Предложения от зрителей */}
            {suggestions.length > 0 && (
              <>
                <div className="border-t border-white/10 my-3"></div>
                <h4 className="text-sm font-bold text-gray-400 mb-2">
                  Предложения
                </h4>
                <div className="space-y-2">
                  {suggestions.map((s) => (
                    <div key={s.id} className="glass rounded-lg p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-purple-400">
                          {s.suggestedBy}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm truncate">
                          {s.title}
                        </span>
                        <button
                          onClick={() => acceptSuggestion(s.id)}
                          className="p-1 hover:bg-green-500/30 rounded text-green-400"
                          title="Принять"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => rejectSuggestion(s.id)}
                          className="p-1 hover:bg-red-500/30 rounded text-red-400"
                          title="Отклонить"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        )}
        {!isHost && (
          <aside className="w-64 glass-card rounded-2xl p-4 flex flex-col min-h-0">
            <h3 className="text-lg font-bold mb-3">Предложить видео</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="YouTube URL..."
                value={suggestInput}
                onChange={(e) => setSuggestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && suggestVideo()}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
  placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
              <button
                onClick={suggestVideo}
                className="px-3 py-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-sm transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Хост увидит ваше предложение
            </p>
          </aside>
        )}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="glass-card rounded-2xl flex-1 flex flex-col items-center justify-center relative overflow-hidden">
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
              <div className="flex flex-col items-center gap-1 p-8">
                {isHost ? (
                  <>
                    <p className="text-gray-300 mb-2">
                      Вставьте ссылку на видео
                    </p>
                    <div className="flex gap-3 w-full max-w-lg">
                      <div className="flex-1">
                        <Input
                          placeholder="YouTube, Vimeo и др..."
                          value={inputUrl}
                          onChange={setInputUrl}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && shareVideo(inputUrl)
                          }
                        />
                      </div>
                      <Button onClick={() => shareVideo(inputUrl)}>
                        Открыть
                      </Button>
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

        {/* Кнопка открытия сайдбара (когда скрыт) */}
        <button
          onClick={() => setSidebarVisible(true)}
          className={`glass-card rounded-xl flex items-center justify-center hover:bg-white/10 transition-all duration-300 shrink-0 self-start ${
            sidebarVisible
              ? 'w-0 opacity-0 p-0 overflow-hidden'
              : 'w-10 h-10 opacity-100'
          }`}
          title="Показать панель"
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <aside
          className={`glass-card rounded-2xl flex flex-col min-h-0 transition-all duration-300 ease-in-out overflow-hidden ${
            sidebarVisible ? 'w-80 p-4 opacity-100' : 'w-0 p-0 opacity-0'
          }`}
        >
          <div
            className={`flex flex-col min-h-0 flex-1 w-72 transition-opacity duration-200 ${
              sidebarVisible ? 'opacity-100 delay-100' : 'opacity-0'
            }`}
          >
            {/* Табы с иконками */}
            <div className="flex gap-2 mb-4 shrink-0">
              <button
                onClick={() => setSidebarVisible(false)}
                className="p-2 rounded-xl glass text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                title="Скрыть панель"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button
                onClick={() => setSidebarTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                  sidebarTab === 'chat'
                    ? 'bg-purple-500/30 text-white'
                    : 'glass text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {sidebarTab === 'chat' && (
                  <span className="text-sm font-medium">Чат</span>
                )}
              </button>
              <button
                onClick={() => setSidebarTab('users')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                  sidebarTab === 'users'
                    ? 'bg-purple-500/30 text-white'
                    : 'glass text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="text-sm font-medium">{users.length}</span>
              </button>
            </div>

            {/* Контент */}
            {sidebarTab === 'chat' ? (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0 mb-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <p className="text-sm">Пока нет сообщений</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, i) => {
                        const isMe = msg.userName === userName
                        const isLast = i === messages.length - 1
                        return (
                          <div
                            key={i}
                            className={`flex ${isLast ? 'animate-message-in' : ''} ${isMe ? 'justify-end pr-2' : 'justify-start pl-2'}`}
                          >
                            <div className="max-w-[80%] relative">
                              <div
                                className={`px-3 py-1.5 pb-4 rounded-2xl relative ${
                                  isMe
                                    ? 'bg-purple-500 text-white rounded-br-none'
                                    : 'bg-slate-700 text-gray-200 rounded-bl-none'
                                }`}
                              >
                                {!isMe && (
                                  <span className="text-xs text-purple-400 font-medium block mb-0.5">
                                    {msg.userName}
                                  </span>
                                )}
                                <p className="text-sm break-words">
                                  {msg.message}
                                </p>
                                <span
                                  className={`absolute bottom-1 right-2 text-[10px] ${
                                    isMe ? 'text-purple-200' : 'text-gray-500'
                                  }`}
                                >
                                  {new Date(msg.timestamp).toLocaleTimeString(
                                    'ru-RU',
                                    { hour: '2-digit', minute: '2-digit' }
                                  )}
                                </span>
                              </div>
                              {/* Хвостик */}
                              <div
                                className={`absolute bottom-0 w-2 h-2 ${
                                  isMe
                                    ? 'right-0 translate-x-full bg-purple-500'
                                    : 'left-0 -translate-x-full bg-slate-700'
                                }`}
                                style={{
                                  clipPath: isMe
                                    ? 'polygon(0 0, 0 100%, 100% 100%)'
                                    : 'polygon(100% 0, 0 100%, 100% 100%)',
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <div className="relative shrink-0">
                  <input
                    type="text"
                    placeholder="Сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                  <button
                    onClick={sendMessage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <img src="/send.svg" alt="Send" className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {users.map((user, index) => (
                    <div
                      key={user.userId}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        readyUsers.includes(user.userId)
                          ? 'bg-green-500/20 border border-green-500/30'
                          : user.userId === hostId
                            ? 'bg-yellow-500/20 border border-yellow-500/30'
                            : 'glass'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          user.userId === hostId
                            ? 'bg-yellow-500/30'
                            : getAvatarColor(user.userName)
                        }`}
                      >
                        {user.userId === hostId
                          ? '👑'
                          : user.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {user.userName}
                          {user.userId === mySocketId && (
                            <span className="text-gray-500 text-xs ml-1">
                              (вы)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.userId === hostId ? 'Хост' : 'Зритель'}
                          {readyUsers.includes(user.userId) && ' • ✓ Готов'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <Button
                variant="secondary"
                onClick={() => setShowExitModal(false)}
              >
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
