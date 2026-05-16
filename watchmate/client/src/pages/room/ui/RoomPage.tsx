import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getRoom, verifyRoomPassword, disconnectSocket, connectSocket } from '../../../shared/api'
import { SOCKET_EVENTS } from '../../../shared/config'
import { Button, Input } from '../../../shared/ui'
import { playNotificationSound, playChatSound, playRequestSound } from '../../../shared/lib'
import { session } from '../../../entities/room'
import { useRoomConnection } from '../../../features/room-connection'
import { useChat } from '../../../features/chat'
import { useReactions } from '../../../features/reactions'
import { useVideoPlayer } from '../../../features/video-player'
import { useQueue } from '../../../features/queue'
import { useSuggestions } from '../../../features/suggestions'
import { useReadySystem } from '../../../features/ready-system'
import { usePlaybackRequests } from '../../../features/playback-requests'
import type { PlaybackRequest } from '../../../features/playback-requests'
import { RoomHeader } from '../../../widgets/room-header'
import { RoomSidebar } from '../../../widgets/room-sidebar'
import { VideoArea } from '../../../widgets/video-area'
import { QueuePanel } from '../../../widgets/queue-panel'
import { SuggestPanel } from '../../../widgets/suggest-panel'

type RoomStatus = 'loading' | 'not-found' | 'join' | 'ready'

function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const locationState = useLocation().state as { isPrivate?: boolean } | null

  const [roomStatus, setRoomStatus] = useState<RoomStatus>('loading')
  const [isPrivate, setIsPrivate] = useState(false)
  const [joined, setJoined] = useState(false)
  const [userName, setUserName] = useState(session.getUserName() ?? '')
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [showExitModal, setShowExitModal] = useState(false)
  const [autoplay, setAutoplay] = useState(false)
  const [chatBadge, setChatBadge] = useState(0)

  const needsPassword = isPrivate && !session.isPasswordVerified(roomId ?? '')

  useEffect(() => {
    if (!roomId) return

    const resolve = (privacyFlag: boolean) => {
      setIsPrivate(privacyFlag)
      const isHost = !!session.getHostToken(roomId)
      const passwordOk = !privacyFlag || isHost || session.isPasswordVerified(roomId)
      setRoomStatus(passwordOk && session.getUserName() ? 'ready' : 'join')
      if (passwordOk && session.getUserName()) setJoined(true)
    }

    if (locationState?.isPrivate !== undefined) {
      resolve(locationState.isPrivate)
    } else {
      getRoom(roomId).then((room) => {
        if (!room) { setRoomStatus('not-found'); return }
        resolve(room.isPrivate)
      })
    }
  }, [roomId]) // eslint-disable-line react-hooks/exhaustive-deps

  const { users, hostId, mySocketId } = useRoomConnection(roomId, userName, joined)
  const isHost = mySocketId === hostId

  const { messages, draft, setDraft, sendMessage, messagesEndRef } = useChat(roomId)
  const { reactions, sendReaction } = useReactions(roomId)
  const {
    videoUrl, localVideo, isPlaying, countdown, inputUrl, setInputUrl, shareVideo, clearVideo, syncPlayback,
    videoRef, onYTReady, onYTDestroy, onYTStateChange,
    onLocalVideoPlay, onLocalVideoPause, onLocalVideoSeeked,
  } = useVideoPlayer(roomId, isHost)
  const { requests, sendRequest, dismissRequest } = usePlaybackRequests(roomId, isHost)
  const { queue, queueInput, setQueueInput, dragOverIndex, setDraggedIndex, setDragOverIndex, addToQueue, removeFromQueue, playFromQueue, playNext, handleDragEnd } = useQueue(roomId)
  const { suggestions, suggestInput, setSuggestInput, suggestVideo, acceptSuggestion, rejectSuggestion } = useSuggestions(roomId)
  const { readyUsers, toggleReady } = useReadySystem(roomId)

  const prevSuggestionsLenRef = useRef(0)
  useEffect(() => {
    if (isHost && suggestions.length > prevSuggestionsLenRef.current) {
      playNotificationSound()
    }
    prevSuggestionsLenRef.current = suggestions.length
  }, [suggestions.length, isHost])

  const prevRequestsLenRef = useRef(0)
  useEffect(() => {
    if (isHost && requests.length > prevRequestsLenRef.current) {
      playRequestSound()
    }
    prevRequestsLenRef.current = requests.length
  }, [requests.length, isHost])

  const prevMessagesLenRef = useRef(0)
  useEffect(() => {
    const len = messages.length
    if (len > prevMessagesLenRef.current) {
      const last = messages[len - 1]
      if (last && last.userName !== userName) {
        playChatSound()
        setChatBadge((n) => n + (len - prevMessagesLenRef.current))
      }
    }
    prevMessagesLenRef.current = len
  }, [messages.length, userName])

  const handleJoin = async () => {
    if (!userName.trim()) return
    if (needsPassword) {
      if (!passwordInput.trim()) { setPasswordError('Введите пароль'); return }
      const ok = await verifyRoomPassword(roomId!, passwordInput.trim())
      if (!ok) { setPasswordError('Неверный пароль'); return }
      session.setPasswordVerified(roomId!)
    }
    session.setUserName(userName.trim())
    setJoined(true)
    setRoomStatus('ready')
  }

  const approveRequest = (req: PlaybackRequest) => {
    if (req.type === 'pause') syncPlayback(false)
    else if (req.type === 'play') syncPlayback(true)
    else if (req.type === 'change-video' && req.videoUrl) shareVideo(req.videoUrl)
    dismissRequest(req.id)
  }

  const handleExit = () => {
    disconnectSocket()
    session.removeUserName()
    navigate('/')
  }

  if (roomStatus === 'loading') {
    return (
      <div className="min-h-screen bg-animated-gradient text-white flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    )
  }

  if (roomStatus === 'not-found') {
    return (
      <div className="min-h-screen bg-animated-gradient text-white flex flex-col items-center justify-center">
        <div className="glass-card rounded-3xl p-10 flex flex-col items-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Комната не найдена</h1>
          <p className="text-gray-400 mb-6 text-center">Комната не существует или была закрыта</p>
          <Button onClick={() => navigate('/')}>На главную</Button>
        </div>
      </div>
    )
  }

  if (roomStatus === 'join') {
    return (
      <div className="min-h-screen bg-animated-gradient text-white flex flex-col items-center justify-center relative">
        <button onClick={() => navigate('/')} className="absolute top-6 left-6 flex items-center gap-2 glass px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад
        </button>

        <div className="glass-card rounded-3xl p-10 flex flex-col items-center">
          <img src="/logo-watchmate.png" alt="WatchMate" className="h-16 w-16 object-contain mb-3" />
          <h1 className="text-4xl font-bold mb-2 text-glow">WatchMate</h1>
          <p className={`text-gray-300 ${needsPassword ? 'mb-2' : 'mb-8'}`}>
            Комната: <code className="glass px-3 py-1 rounded-lg ml-1">{roomId}</code>
          </p>
          {needsPassword && <p className="text-purple-400 text-sm mb-6">🔒 Приватная комната</p>}
          <div className="flex flex-col gap-4 w-full min-w-[280px]">
            <Input placeholder="Введи своё имя" value={userName} onChange={setUserName}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()} />
            {needsPassword && (
              <Input placeholder="Пароль комнаты" value={passwordInput} onChange={setPasswordInput}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()} />
            )}
            {passwordError && <p className="text-red-400 text-sm text-center">{passwordError}</p>}
            <Button onClick={handleJoin}>Войти в комнату</Button>
          </div>
        </div>
      </div>
    )
  }


  const queuePanelProps = {
    queue, suggestions, queueInput, onQueueInputChange: setQueueInput,
    onAdd: addToQueue, onRemove: removeFromQueue, onPlay: playFromQueue, onNext: playNext,
    dragOverIndex, onDragStart: setDraggedIndex, onDragOver: setDragOverIndex, onDragEnd: handleDragEnd,
    onAcceptSuggestion: acceptSuggestion, onRejectSuggestion: rejectSuggestion,
    autoplay, onToggleAutoplay: () => setAutoplay((p) => !p),
  }

  const suggestPanelProps = {
    queue, suggestInput, onSuggestInputChange: setSuggestInput, onSuggest: suggestVideo,
    onSendRequest: sendRequest, hasVideo: !!videoUrl || !!localVideo,
  }

  const videoAreaProps = {
    videoUrl, localVideo, isPlaying, countdown, isHost, autoplay, reactions,
    readyUsers, users, currentUserName: userName, inputUrl, onInputUrlChange: setInputUrl,
    onShareVideo: shareVideo, onClearVideo: clearVideo, onToggleReady: toggleReady,
    onSendReaction: sendReaction, onPlayNextFromQueue: playNext, queueLength: queue.length,
    videoRef, onYTReady, onYTDestroy, onYTStateChange,
    onLocalVideoPlay, onLocalVideoPause, onLocalVideoSeeked,
  }

  return (
    <div className="h-[100dvh] bg-animated-gradient text-white flex flex-col overflow-hidden p-3 md:p-6 gap-3">

      {isHost && requests.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
          <div className="relative z-10 flex flex-col gap-3 w-full max-w-sm">
            {requests.map((req) => (
              <div key={req.id} className="glass-card rounded-2xl p-5 flex flex-col gap-4 border border-purple-500/40 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-lg font-bold shrink-0">
                    {req.fromUserName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{req.fromUserName}</p>
                    <p className="text-sm text-gray-300">
                      {req.type === 'pause' && 'просит поставить на паузу'}
                      {req.type === 'play' && 'просит продолжить воспроизведение'}
                      {req.type === 'change-video' && `хочет сменить видео`}
                    </p>
                    {req.type === 'change-video' && req.videoUrl && (
                      <p className="text-xs text-purple-300 mt-0.5 truncate max-w-[220px]">{req.videoUrl}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveRequest(req)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600/80 hover:bg-purple-600 transition-colors">
                    Принять
                  </button>
                  <button onClick={() => dismissRequest(req.id)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold glass hover:bg-white/10 transition-colors">
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RoomHeader roomId={roomId!} users={users} hostId={hostId} isPrivate={isPrivate} onExit={() => setShowExitModal(true)} />

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3">

        {/* Центр: видео */}
        <div className="flex-1 min-h-0 flex flex-col">
          <VideoArea {...videoAreaProps} />
        </div>

        {/* Кнопка открытия сайдбара — desktop inline, mobile floating */}
        {!sidebarVisible && (() => {
          const totalBadge = chatBadge + (isHost ? suggestions.length : 0)
          return (
            <>
              <button onClick={() => setSidebarVisible(true)}
                className="relative hidden md:flex glass-card w-10 h-10 rounded-xl items-center justify-center hover:bg-white/10 transition-all shrink-0 self-start"
                title="Показать панель">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {totalBadge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {totalBadge}
                  </span>
                )}
              </button>
              <button onClick={() => setSidebarVisible(true)}
                className="relative md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-30 glass-card px-1.5 py-3 rounded-l-xl hover:bg-white/10 transition-all"
                title="Открыть панель">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {totalBadge > 0 && (
                  <span className="absolute -top-1.5 -right-0 min-w-[18px] h-[18px] px-1 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {totalBadge}
                  </span>
                )}
              </button>
            </>
          )
        })()}

        {/* Сайдбар — desktop: inline, mobile: fixed overlay */}
        <RoomSidebar visible={sidebarVisible} onHide={() => setSidebarVisible(false)}
          users={users} hostId={hostId} mySocketId={mySocketId} readyUsers={readyUsers}
          messages={messages} draft={draft} onDraftChange={setDraft}
          onSend={sendMessage} messagesEndRef={messagesEndRef} currentUserName={userName}
          panelContent={isHost ? <QueuePanel {...queuePanelProps} /> : <SuggestPanel {...suggestPanelProps} />}
          panelLabel={isHost ? 'Очередь' : 'Предложить'}
          panelBadge={isHost ? suggestions.length : 0}
          chatBadge={chatBadge}
          onChatTabOpen={() => setChatBadge(0)}
          onTransferHost={(userId) => connectSocket().emit(SOCKET_EVENTS.TRANSFER_HOST, userId)} />
      </div>

      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitModal(false)} />
          <div className="glass-card rounded-2xl p-6 md:p-8 z-10 flex flex-col items-center gap-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-glow">Выйти из комнаты?</h2>
            <p className="text-gray-300 text-center">Вы уверены, что хотите покинуть комнату?</p>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setShowExitModal(false)}>Отмена</Button>
              <button onClick={handleExit} className="px-6 py-3 rounded-xl font-semibold bg-red-500/80 hover:bg-red-500 border border-red-400/50 transition-all">
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
