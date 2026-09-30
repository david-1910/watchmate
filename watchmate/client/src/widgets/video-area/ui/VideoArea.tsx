import { ListPlus, Play, Tv } from 'lucide-react'
import { LinkInput, RutubePlayer, YouTubePlayer } from '@/shared/ui'
import { parseVideoLink, useFullscreen, validateVideoLink, type YTPlayer } from '@/shared/lib'
import { FloatingReaction, type Reaction } from '@/entities/reaction'
import { ReadyOverlay } from '@/features/ready-system'
import { CountdownOverlay, EnableSoundButton } from '@/features/video-player'
import { ControlBar, type ControlBarProps } from './ControlBar'

type Props = Omit<ControlBarProps, 'hasVideo' | 'fullscreenSupported' | 'fullscreenActive' | 'onToggleFullscreen'> & {
  videoUrl: string
  countdown: number | null
  reactions: Reaction[]
  readyUsers: string[]
  viewersCount: number
  allReady: boolean
  myUserId: string | null
  onEnableSound: () => void
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
    videoUrl, videoStarted, countdown, soundBlocked, onEnableSound, isHost, reactions,
    readyUsers, viewersCount, allReady, myUserId, onToggleReady, onStartWatching,
    draft, onDraftChange, onPlayNow, onAddToQueue, onOpenQueue,
    onYTReady, onYTDestroy, onYTStateChange,
  } = props
  const source = videoUrl ? parseVideoLink(videoUrl) : null
  const fullscreen = useFullscreen<HTMLDivElement>()

  return (
    // В полный экран уходит видео вместе с панелью — иначе на телефоне нечем выйти (нет Esc)
    <div ref={fullscreen.ref} className={`h-full flex flex-col min-h-0 gap-2 ${fullscreen.active ? 'bg-black p-2' : ''}`}>
      <div
        className="glass-card rounded-2xl flex-1 min-h-0 flex flex-col items-center justify-center relative isolate overflow-hidden">
        {/* Слои карточки идут по порядку в DOM (без z-index): плеер → щит → реакции → звук → готовность → отсчёт */}
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
            {soundBlocked && <EnableSoundButton onClick={onEnableSound} />}
            {/* На время отсчёта оверлей готовности скрыт — иначе «Начать» висит поверх цифр */}
            {!videoStarted && countdown === null && (
              <ReadyOverlay isHost={isHost} readyUsers={readyUsers} viewersCount={viewersCount} allReady={allReady}
                myUserId={myUserId} onToggle={onToggleReady} onStart={onStartWatching} />
            )}
          </>
        ) : (
          <>
            {videoUrl ? (
              <iframe src={videoUrl} width="100%" height="100%" style={{ border: 'none' }}
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
      </div>

      <ControlBar {...props} hasVideo={!!videoUrl}
        fullscreenSupported={fullscreen.supported} fullscreenActive={fullscreen.active}
        onToggleFullscreen={fullscreen.toggle} />
    </div>
  )
}
