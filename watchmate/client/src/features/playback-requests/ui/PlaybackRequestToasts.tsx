import { Pause, Play, RefreshCw, X } from 'lucide-react'
import { Portal } from '@/shared/ui'
import type { PlaybackRequest } from '../model/types'

type Props = {
  requests: PlaybackRequest[]
  onApprove: (req: PlaybackRequest) => void
  onDismiss: (id: string) => void
}

const MAX_VISIBLE = 3

const REQUEST_VIEW: Record<
  PlaybackRequest['type'],
  { text: string; Icon: typeof Pause }
> = {
  pause: { text: 'просит паузу', Icon: Pause },
  play: { text: 'просит продолжить', Icon: Play },
  'change-video': { text: 'предлагает сменить видео', Icon: RefreshCw },
}

// Запросы зрителей — уведомления в углу, не прерывают просмотр
export const PlaybackRequestToasts = ({
  requests,
  onApprove,
  onDismiss,
}: Props) => {
  if (requests.length === 0) return null
  const visible = requests.slice(-MAX_VISIBLE)
  const hidden = requests.length - visible.length

  return (
    <Portal>
      <div
        className="fixed z-toast top-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:top-24 sm:w-80 flex flex-col gap-2"
        role="status"
      >
        {hidden > 0 && (
          <p className="text-xs text-gray-300 text-right">ещё {hidden}</p>
        )}
        {visible.map((req) => {
          const { text, Icon } = REQUEST_VIEW[req.type]
          return (
            <div
              key={req.id}
              className="surface-floating rounded-2xl p-3 !border-purple-500/40"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-500/30 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-purple-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{req.fromUserName}</span>{' '}
                    <span className="text-gray-200">{text}</span>
                  </p>
                  {req.videoUrl && (
                    <p className="text-xs text-purple-300 truncate">
                      {req.videoUrl}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onDismiss(req.id)}
                  title="Скрыть"
                  className="text-gray-300 hover:text-white -mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onApprove(req)}
                  className="flex-1 py-1.5 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 transition-colors"
                >
                  Принять
                </button>
                <button
                  onClick={() => onDismiss(req.id)}
                  className="flex-1 py-1.5 rounded-lg text-sm font-semibold glass hover:bg-white/10 transition-colors"
                >
                  Отклонить
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Portal>
  )
}
