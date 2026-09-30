import { Check, Play } from 'lucide-react'
import { Button } from '@/shared/ui'

type Props = {
  isHost: boolean
  readyUsers: string[]
  viewersCount: number
  allReady: boolean
  myUserId: string | null
  onToggle: () => void
  onStart: () => void
}

// Зритель жмёт «Готов», хост ждёт и получает «Начать», когда готовы все зрители
export const ReadyOverlay = ({ isHost, readyUsers, viewersCount, allReady, myUserId, onToggle, onStart }: Props) => {
  const isReady = !!myUserId && readyUsers.includes(myUserId)
  const readyCount = Math.min(readyUsers.length, viewersCount)

  return (
    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-4">
      <p className="text-2xl font-bold text-glow">
        {isHost ? (allReady ? 'Все готовы!' : 'Ждём зрителей') : 'Все готовы?'}
      </p>
      {viewersCount > 0 && (
        <p className="text-gray-300">
          {readyCount}/{viewersCount} зрителей готовы
        </p>
      )}
      {isHost ? (
        allReady && (
          <Button onClick={onStart}>
            <span className="inline-flex items-center gap-2"><Play className="w-4 h-4 fill-current" />Начать</span>
          </Button>
        )
      ) : (
        <Button onClick={onToggle}>
          {isReady ? (
            <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" />Я готов!</span>
          ) : 'Готов!'}
        </Button>
      )}
    </div>
  )
}
