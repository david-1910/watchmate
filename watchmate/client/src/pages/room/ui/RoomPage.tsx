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

  const isHost = mySocketId === hostId

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

  if (!joined) {
    return (
      <div className="min-h-screen bg-animated-gradient text-white flex flex-col items-center justify-center relative">
        {/* Кнопка назад */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 flex items-center gap-2 glass px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад
        </button>

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
          <button
            onClick={() => setShowExitModal(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl glass hover:bg-white/10 transition-all"
            title="Назад"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <img src="/logo-watchmate.png" alt="WatchMate" className="h-10 w-10 object-contain" />
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
                    user.userId === hostId ? 'bg-yellow-500/50' : 'bg-purple-500/50'
                  }`}
                  title={user.userName}
                >
                  {user.userId === hostId ? '👑' : user.userName.charAt(0).toUpperCase()}
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
            <span className="text-gray-400 text-sm">Комната:</span>
            <code className="font-mono text-sm text-white group-hover:text-purple-300 transition-colors">{id}</code>
            {copied ? (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="flex gap-4 flex-1 min-h-0">
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
            ) : hostFileName && !isHost ? (
              <div className="flex flex-col items-center gap-4 p-8">
                <p className="text-gray-300 text-center">
                  Хост загрузил локальный файл:
                </p>
                <code className="glass px-4 py-2 rounded-lg text-purple-300 text-sm max-w-md truncate">
                  {hostFileName}
                </code>
                <p className="text-gray-400 text-sm text-center">
                  Загрузите тот же файл для синхронного просмотра
                </p>
                <label className="glass-button px-5 py-3 rounded-xl cursor-pointer flex items-center gap-2">
                  Загрузить файл
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
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
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <aside className={`glass-card rounded-2xl flex flex-col min-h-0 transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarVisible
            ? 'w-80 p-4 opacity-100'
            : 'w-0 p-0 opacity-0'
        }`}>
          <div className={`flex flex-col min-h-0 flex-1 w-72 transition-opacity duration-200 ${
            sidebarVisible ? 'opacity-100 delay-100' : 'opacity-0'
          }`}>
          {/* Табы с иконками */}
          <div className="flex gap-2 mb-4 shrink-0">
            <button
              onClick={() => setSidebarVisible(false)}
              className="p-2 rounded-xl glass text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              title="Скрыть панель"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {sidebarTab === 'chat' && <span className="text-sm font-medium">Чат</span>}
            </button>
            <button
              onClick={() => setSidebarTab('users')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                sidebarTab === 'users'
                  ? 'bg-purple-500/30 text-white'
                  : 'glass text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">Пока нет сообщений</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className="glass rounded-xl p-3">
                      <span className="text-sm text-purple-400 font-semibold">
                        {msg.userName}
                      </span>
                      <p className="mt-1 text-gray-200 text-sm">{msg.message}</p>
                    </div>
                  ))
                )}
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      user.userId === hostId ? 'bg-yellow-500/30' : 'bg-purple-500/30'
                    }`}>
                      {user.userId === hostId ? '👑' : user.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {user.userName}
                        {user.userId === mySocketId && <span className="text-gray-500 text-xs ml-1">(вы)</span>}
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
