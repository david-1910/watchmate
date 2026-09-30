import { Maximize, Minimize, Repeat, SkipForward, X } from 'lucide-react'
import { ReactionBar } from '@/features/reactions'
import { RequestPlaybackButton, type RequestType } from '@/features/playback-requests'

export type ControlBarProps = {
  isHost: boolean
  hasVideo: boolean
  videoStarted: boolean
  isPlaying: boolean
  // Зритель: запросы к хосту (звуком и плеером он не управляет)
  onRequestPlayback: (type: RequestType) => void
  requestPending: boolean
  // Хост: очередь и видео
  nextTitle: string | null
  autoplay: boolean
  onToggleAutoplay: () => void
  onNext: () => void
  onCloseVideo: () => void
  // Оба
  fullscreenSupported: boolean
  fullscreenActive: boolean
  onToggleFullscreen: () => void
  onSendReaction: (emoji: string) => void
}

const BTN = 'inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-semibold transition-colors'

const HostControls = ({ nextTitle, autoplay, onToggleAutoplay, onNext, onCloseVideo }: ControlBarProps) => (
  <>
    <button onClick={onNext} disabled={!nextTitle}
      title={nextTitle ? `Следующее: ${nextTitle}` : 'Очередь пуста'}
      className={`${BTN} glass hover:bg-white/10 text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed`}>
      <SkipForward className="w-4 h-4" />
      <span className="hidden xs:inline">Следующее</span>
    </button>
    <button onClick={onToggleAutoplay} aria-pressed={autoplay}
      title="Автоматически включать следующее видео из очереди"
      className={`${BTN} ${autoplay ? 'bg-green-500/20 text-green-300' : 'glass hover:bg-white/10 text-gray-400'}`}>
      <Repeat className="w-4 h-4" />
      <span className="hidden sm:inline">Автоочередь</span>
    </button>
    <button onClick={onCloseVideo} title="Закрыть видео у всех"
      className={`${BTN} glass hover:bg-red-500/30 text-gray-300 hover:text-white`}>
      <X className="w-4 h-4" />
      <span className="hidden sm:inline">Закрыть видео</span>
    </button>
  </>
)

const ViewerControls = (p: ControlBarProps) => (
  <>
    {p.videoStarted && <RequestPlaybackButton isPlaying={p.isPlaying} pending={p.requestPending} onRequest={p.onRequestPlayback} />}
  </>
)

type FullscreenButtonProps = { active: boolean; onToggle: () => void; className?: string }

const FullscreenButton = ({ active, onToggle, className = '' }: FullscreenButtonProps) => {
  const Icon = active ? Minimize : Maximize
  return (
    <button onClick={onToggle} title={active ? 'Выйти из полноэкранного режима' : 'На весь экран'}
      className={`shrink-0 h-9 px-2.5 rounded-xl glass hover:bg-white/10 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-200 transition-colors ${className}`}>
      <Icon className="w-4 h-4" />
      <span className="hidden md:inline">{active ? 'Свернуть' : 'На весь экран'}</span>
    </button>
  )
}

// Панель под видео: в полноэкранном режиме — оверлей с полупрозрачным фоном
export const ControlBar = (props: ControlBarProps) => {
  const { isHost, hasVideo, fullscreenSupported, fullscreenActive, onToggleFullscreen, onSendReaction } = props
  const showFullscreen = hasVideo && fullscreenSupported

  return (
    <div
      className={`w-full rounded-2xl px-2.5 py-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 shrink-0 transition-all ${
        fullscreenActive
          ? 'bg-black/75 backdrop-blur-md border border-white/15 shadow-2xl'
          : 'glass'
      }`}
    >
      {hasVideo && (
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
          {isHost ? <HostControls {...props} /> : <ViewerControls {...props} />}
          {showFullscreen && (
            <FullscreenButton active={fullscreenActive} onToggle={onToggleFullscreen} className="ml-auto sm:hidden" />
          )}
        </div>
      )}
      <div className="flex items-center gap-1 w-full sm:w-auto sm:ml-auto min-w-0 justify-between sm:justify-end">
        <ReactionBar onSend={onSendReaction} />
        {showFullscreen && (
          <FullscreenButton active={fullscreenActive} onToggle={onToggleFullscreen} className="hidden sm:inline-flex" />
        )}
      </div>
    </div>
  )
}

