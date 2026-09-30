import { Maximize, Minimize, Repeat, SkipForward, X } from 'lucide-react'
import { ReactionBar } from '@/features/reactions'
import { VolumeControl } from '@/features/video-player'
import { RequestPlaybackButton, type RequestType } from '@/features/playback-requests'

export type ControlBarProps = {
  isHost: boolean
  hasVideo: boolean
  videoStarted: boolean
  isPlaying: boolean
  // Зритель: звук и запросы к хосту
  volume: number
  muted: boolean
  soundBlocked: boolean
  onToggleMute: () => void
  onVolumeChange: (value: number) => void
  onRequestPlayback: (type: RequestType) => void
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
    <VolumeControl volume={p.volume} muted={p.muted} soundBlocked={p.soundBlocked}
      onToggleMute={p.onToggleMute} onVolumeChange={p.onVolumeChange} />
    {p.videoStarted && <RequestPlaybackButton isPlaying={p.isPlaying} onRequest={p.onRequestPlayback} />}
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

// Панель под видео: ничего не перекрывает в плеере
export const ControlBar = (props: ControlBarProps) => {
  const { isHost, hasVideo, fullscreenSupported, fullscreenActive, onToggleFullscreen, onSendReaction } = props
  const showFullscreen = hasVideo && fullscreenSupported

  return (
    <div className="glass rounded-2xl px-2 py-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 shrink-0">
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

