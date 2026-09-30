import { Loader2, Pause, Play } from 'lucide-react'
import type { RequestType } from '../model/types'

type Props = {
  isPlaying: boolean
  // Ждём ответа хоста на предыдущий запрос — новый не отправляем
  pending: boolean
  onRequest: (type: RequestType) => void
}

// Зритель не управляет плеером — он просит хоста поставить паузу или продолжить
export const RequestPlaybackButton = ({ isPlaying, pending, onRequest }: Props) => {
  if (pending) {
    return (
      <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm text-gray-300 bg-white/5">
        <Loader2 className="w-4 h-4 animate-spin" />
        Ждём ответа хоста…
      </span>
    )
  }

  const Icon = isPlaying ? Pause : Play
  return (
    <button onClick={() => onRequest(isPlaying ? 'pause' : 'play')}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-semibold glass hover:bg-white/10 text-gray-200 transition-colors">
      <Icon className="w-4 h-4" />
      {isPlaying ? 'Попросить паузу' : 'Попросить продолжить'}
    </button>
  )
}
