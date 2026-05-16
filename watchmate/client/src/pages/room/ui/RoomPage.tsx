import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoom, verifyRoomPassword, disconnectSocket } from '../../../shared/api'
import { Button, Input } from '../../../shared/ui'
import { session } from '../../../entities/room'
import { useRoomConnection } from '../../../features/room-connection'
import { useChat } from '../../../features/chat'
import { useReactions } from '../../../features/reactions'
import { useVideoPlayer } from '../../../features/video-player'
import { useQueue } from '../../../features/queue'
import { useSuggestions } from '../../../features/suggestions'
import { useReadySystem } from '../../../features/ready-system'
import { RoomHeader } from '../../../widgets/room-header'
import { RoomSidebar } from '../../../widgets/room-sidebar'
import { VideoArea } from '../../../widgets/video-area'
import { QueuePanel } from '../../../widgets/queue-panel'
import { SuggestPanel } from '../../../widgets/suggest-panel'

type RoomStatus = 'loading' | 'not-found' | 'join' | 'ready'

function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [roomStatus, setRoomStatus] = useState<RoomStatus>('loading')
  const [isPrivate, setIsPrivate] = useState(false)
  const [joined, setJoined] = useState(false)
  const [userName, setUserName] = useState(session.getUserName() ?? '')
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [showExitModal, setShowExitModal] = useState(false)
  const [autoplay, setAutoplay] = useState(false)

  const needsPassword = isPrivate && !session.isPasswordVerified(roomId ?? '')

  useEffect(() => {
    if (!roomId) return
    getRoom(roomId).then((room) => {
      if (!room) { setRoomStatus('not-found'); return }
      setIsPrivate(room.isPrivate)
      const isHost = !!session.getHostToken(roomId)
      const passwordOk = !room.isPrivate || isHost || session.isPasswordVerified(roomId)
      setRoomStatus(passwordOk && session.getUserName() ? 'ready' : 'join')
      if (passwordOk && session.getUserName()) setJoined(true)
    })
  }, [roomId])

  const { users, hostId, mySocketId } = useRoomConnection(roomId, userName, joined)
  const { messages, draft, setDraft, sendMessage, messagesEndRef } = useChat(roomId)
  const { reactions, sendReaction } = useReactions(roomId)
  const { videoUrl, localVideo, isPlaying, countdown, inputUrl, setInputUrl, shareVideo, clearVideo } = useVideoPlayer(roomId)
  const { queue, queueInput, setQueueInput, dragOverIndex, setDraggedIndex, setDragOverIndex, addToQueue, removeFromQueue, playFromQueue, playNext, handleDragEnd } = useQueue(roomId)
  const { suggestions, suggestInput, setSuggestInput, suggestVideo, acceptSuggestion, rejectSuggestion } = useSuggestions(roomId)
  const { readyUsers, toggleReady } = useReadySystem(roomId)

  const isHost = mySocketId === hostId

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

  return (
    <div className="h-screen bg-animated-gradient text-white p-6 flex flex-col overflow-hidden">
      <RoomHeader roomId={roomId!} users={users} hostId={hostId} isPrivate={isPrivate} onExit={() => setShowExitModal(true)} />

      <main className="flex gap-4 flex-1 min-h-0">
        {isHost ? (
          <QueuePanel queue={queue} suggestions={suggestions}
            queueInput={queueInput} onQueueInputChange={setQueueInput}
            onAdd={addToQueue} onRemove={removeFromQueue} onPlay={playFromQueue} onNext={playNext}
            dragOverIndex={dragOverIndex}
            onDragStart={setDraggedIndex} onDragOver={setDragOverIndex} onDragEnd={handleDragEnd}
            onAcceptSuggestion={acceptSuggestion} onRejectSuggestion={rejectSuggestion}
            autoplay={autoplay} onToggleAutoplay={() => setAutoplay((p) => !p)} />
        ) : (
          <SuggestPanel queue={queue} suggestInput={suggestInput}
            onSuggestInputChange={setSuggestInput} onSuggest={suggestVideo} />
        )}

        <VideoArea
          videoUrl={videoUrl} localVideo={localVideo} isPlaying={isPlaying} countdown={countdown}
          isHost={isHost} autoplay={autoplay} reactions={reactions}
          readyUsers={readyUsers} users={users} currentUserName={userName}
          inputUrl={inputUrl} onInputUrlChange={setInputUrl}
          onShareVideo={shareVideo} onClearVideo={clearVideo}
          onToggleReady={toggleReady} onSendReaction={sendReaction}
          onPlayNextFromQueue={playNext} queueLength={queue.length} />

        <button onClick={() => setSidebarVisible(true)}
          className={`glass-card rounded-xl flex items-center justify-center hover:bg-white/10 transition-all duration-300 shrink-0 self-start ${sidebarVisible ? 'w-0 opacity-0 p-0 overflow-hidden' : 'w-10 h-10 opacity-100'}`}
          title="Показать панель">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <RoomSidebar visible={sidebarVisible} onHide={() => setSidebarVisible(false)}
          users={users} hostId={hostId} mySocketId={mySocketId} readyUsers={readyUsers}
          messages={messages} draft={draft} onDraftChange={setDraft}
          onSend={sendMessage} messagesEndRef={messagesEndRef} currentUserName={userName} />
      </main>

      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitModal(false)} />
          <div className="glass-card rounded-2xl p-8 z-10 flex flex-col items-center gap-6 max-w-sm">
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
