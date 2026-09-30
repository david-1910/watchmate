import { useState, useEffect, useRef, useCallback } from 'react'
import { ListPlus, Play, Tv } from 'lucide-react'
import { LinkInput, RutubePlayer, YouTubePlayer } from '@/shared/ui'
import { parseVideoLink, useFullscreen, useWakeLock, validateVideoLink, type YTPlayer } from '@/shared/lib'
import { FloatingReaction, type Reaction } from '@/entities/reaction'
import type { DisplayMessage } from '@/entities/message'
import { ChatOverlay } from '@/features/chat'
import { ReadyOverlay } from '@/features/ready-system'
import { CountdownOverlay } from '@/features/video-player'
import { ControlBar, type ControlBarProps } from './ControlBar'

type Props = Omit<ControlBarProps, 'hasVideo' | 'fullscreenSupported' | 'fullscreenActive' | 'onToggleFullscreen'> & {
  videoUrl: string
  countdown: number | null
  // Сообщения чата — в полноэкранном режиме новые показываются поверх видео
  chatMessages: DisplayMessage[]
  reactions: Reaction[]
  readyUsers: string[]
  viewersCount: number
  allReady: boolean
  myUserId: string | null
  onToggleReady: () => void
  onStartWatching: () => void
  // Пустое состояние: хост вставляет ссылку, зритель может перейти к предложениям
  draft: string
  onDraftChange: (value: string) => void
  onPlayNow: (url: string) => void
  onAddToQueue: (url: string) => void
  onOpenQueue: () => void
  onYTReady: (player: YTPlayer) => void
  onYTDestroy: () => void
  onYTStateChange: (state: number, currentTime: number) => void
}

const HIDE_CONTROLS_DELAY_MS = 3000

const HostEmptyState = ({ draft, onDraftChange, onPlayNow, onAddToQueue }: Pick<Props, 'draft' | 'onDraftChange' | 'onPlayNow' | 'onAddToQueue'>) => (
  <div className="flex flex-col items-center gap-4 p-6 w-full max-w-xl">
    <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-purple-300">
      <Tv className="w-7 h-7" />
    </div>
    <div className="text-center">
      <p className="text-lg font-semibold">Что будем смотреть?</p>
      <p className="text-sm text-gray-400">Вставьте ссылку на видео YouTube или Rutube</p>
    </div>
    <LinkInput layout="row" value={draft} onChange={onDraftChange} placeholder="Ссылка на YouTube или Rutube"
      validate={validateVideoLink}
      actions={[
        { label: 'Смотреть', icon: <Play className="w-4 h-4" />, onClick: onPlayNow, primary: true },
        { label: 'В очередь', icon: <ListPlus className="w-4 h-4" />, onClick: onAddToQueue },
      ]} />
  </div>
)

const ViewerEmptyState = ({ onOpenQueue }: { onOpenQueue: () => void }) => (
  <div className="flex flex-col items-center gap-3 p-6 text-center">
    <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-purple-300">
      <Tv className="w-7 h-7" />
    </div>
    <p className="text-lg font-semibold">Хост скоро включит видео</p>
    <button onClick={onOpenQueue} className="text-sm text-purple-300 hover:text-purple-200 underline underline-offset-4">
      Предложить своё видео
    </button>
  </div>
)

export const VideoArea = (props: Props) => {
  const {
    videoUrl, isPlaying, videoStarted, countdown, chatMessages, isHost, reactions,
    readyUsers, viewersCount, allReady, myUserId, onToggleReady, onStartWatching,
    draft, onDraftChange, onPlayNow, onAddToQueue, onOpenQueue,
    onYTReady, onYTDestroy, onYTStateChange,
  } = props
  const source = videoUrl ? parseVideoLink(videoUrl) : null
  const fullscreen = useFullscreen<HTMLDivElement>()

  // Предотвращаем уход телефона в спящий режим во время проигрывания
  useWakeLock(isPlaying)

  // В полноэкранном режиме панель управления скрывается через 3 секунды бездействия
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const autoHide = fullscreen.active && isPlaying

  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)

    if (autoHide) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false)
      }, HIDE_CONTROLS_DELAY_MS)
    }
  }, [autoHide])

  useEffect(() => {
    if (!autoHide) {
      setControlsVisible(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      return
    }

    showControls()

    const onUserActivity = () => showControls()
    window.addEventListener('pointermove', onUserActivity)
    window.addEventListener('pointerdown', onUserActivity)
    window.addEventListener('touchstart', onUserActivity, { passive: true })
    window.addEventListener('keydown', onUserActivity)

    return () => {
      window.removeEventListener('pointermove', onUserActivity)
      window.removeEventListener('pointerdown', onUserActivity)
      window.removeEventListener('touchstart', onUserActivity)
      window.removeEventListener('keydown', onUserActivity)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [autoHide, showControls])

  return (
    <div
      ref={fullscreen.ref}
      onMouseMove={showControls}
      onTouchStart={showControls}
      onClick={showControls}
      className={
        fullscreen.active
          ? `fixed inset-0 bg-black w-screen h-screen overflow-hidden relative flex flex-col items-center justify-center ${
              !controlsVisible ? 'cursor-none' : ''
            }`
          : 'h-full flex flex-col min-h-0 gap-2 relative'
      }
    >
      <div
        className={
          fullscreen.active
            ? 'absolute inset-0 w-full h-full flex flex-col items-center justify-center isolate overflow-hidden bg-black'
            : 'glass-card rounded-2xl flex-1 min-h-0 flex flex-col items-center justify-center relative isolate overflow-hidden'
        }
      >
        {/* Слои карточки идут по порядку в DOM (без z-index): плеер → щит → реакции → готовность → отсчёт */}
        {source ? (
          <>
            {/* Оба плеера отдают одинаковый интерфейс — синхронизация не зависит от источника */}
            {source.provider === 'youtube' ? (
              <YouTubePlayer key={source.id} videoId={source.id}
                onReady={onYTReady} onDestroy={onYTDestroy} onStateChange={onYTStateChange} />
            ) : (
              <RutubePlayer key={source.id} videoId={source.id} privateKey={source.privateKey}
                onReady={onYTReady} onDestroy={onYTDestroy} onStateChange={onYTStateChange} />
            )}
            {/* Зритель не управляет плеером — звук, полный экран и запросы вынесены в панель под видео */}
            {/* Щит всегда, а не только при воспроизведении — иначе на паузе хоста зритель запустил бы видео сам */}
            {!isHost && <div className="absolute inset-0" />}
            {reactions.map((r) => <FloatingReaction key={r.id} reaction={r} />)}
            {/* На время отсчёта оверлей готовности скрыт — иначе «Начать» висит поверх цифр */}
            {!videoStarted && countdown === null && (
              <ReadyOverlay isHost={isHost} readyUsers={readyUsers} viewersCount={viewersCount} allReady={allReady}
                myUserId={myUserId} onToggle={onToggleReady} onStart={onStartWatching} />
            )}
          </>
        ) : (
          <>
            {videoUrl ? (
              <iframe src={videoUrl} width="100%" height="100%" className="w-full h-full" style={{ border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : isHost ? (
              <HostEmptyState draft={draft} onDraftChange={onDraftChange} onPlayNow={onPlayNow} onAddToQueue={onAddToQueue} />
            ) : (
              <ViewerEmptyState onOpenQueue={onOpenQueue} />
            )}
            {reactions.map((r) => <FloatingReaction key={r.id} reaction={r} />)}
          </>
        )}

        {countdown !== null && <CountdownOverlay count={countdown} />}

        {/* Панель скрыта: движения над плеером уходят в iframe и страница их не видит.
            Прозрачный слой ловит первое движение/касание и возвращает панель */}
        {fullscreen.active && !controlsVisible && (
          <div className="absolute inset-0" onPointerMove={showControls} onPointerDown={showControls} />
        )}
      </div>

      {/* Новые сообщения чата — выше нашей панели и нижней строки плеера (время, прогресс); когда панель скрыта, опускаются ниже */}
      {fullscreen.active && (
        <ChatOverlay messages={chatMessages} myUserId={myUserId}
          className={`absolute left-4 md:left-8 transition-[bottom] duration-300 ${controlsVisible ? 'bottom-44 sm:bottom-36' : 'bottom-6'}`} />
      )}

      {/* Панель управления: в обычном режиме снизу, в полноэкранном — плавающий оверлей поверх видео со скрытием через 3 секунды */}
      <div
        className={
          fullscreen.active
            ? `absolute bottom-3 inset-x-3 md:bottom-5 md:inset-x-8 max-w-5xl mx-auto flex justify-center w-[calc(100%-1.5rem)] md:w-[calc(100%-3rem)] transition-all duration-300 ${
                controlsVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
              }`
            : 'shrink-0'
        }
      >
        <ControlBar
          {...props}
          hasVideo={!!videoUrl}
          fullscreenSupported={fullscreen.supported}
          fullscreenActive={fullscreen.active}
          onToggleFullscreen={fullscreen.toggle}
        />
      </div>
    </div>
  )
}
