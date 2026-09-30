import { useEffect, useRef, useState } from 'react'
import { Check, Pause, Play } from 'lucide-react'
import type { RequestType } from '../model/types'

type Props = {
  isPlaying: boolean
  onRequest: (type: RequestType) => void
}

const SENT_RESET_MS = 3000

// Зритель не управляет плеером — он просит хоста поставить паузу или продолжить
export const RequestPlaybackButton = ({ isPlaying, onRequest }: Props) => {
  const [sent, setSent] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const send = () => {
    onRequest(isPlaying ? 'pause' : 'play')
    setSent(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSent(false), SENT_RESET_MS)
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm text-green-300 bg-green-500/10">
        <Check className="w-4 h-4" />
        Хост получил запрос
      </span>
    )
  }

  const Icon = isPlaying ? Pause : Play
  return (
    <button onClick={send}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-semibold glass hover:bg-white/10 text-gray-200 transition-colors">
      <Icon className="w-4 h-4" />
      {isPlaying ? 'Попросить паузу' : 'Попросить продолжить'}
    </button>
  )
}
