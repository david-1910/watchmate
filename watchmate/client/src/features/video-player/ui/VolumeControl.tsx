import { Volume1, Volume2, VolumeX } from 'lucide-react'

type Props = {
  volume: number
  muted: boolean
  // Браузер запустил видео без звука — кнопка подсвечивается и подписана
  soundBlocked: boolean
  onToggleMute: () => void
  onVolumeChange: (value: number) => void
}

export const VolumeControl = ({ volume, muted, soundBlocked, onToggleMute, onVolumeChange }: Props) => {
  const silent = muted || volume === 0
  const Icon = silent ? VolumeX : volume < 50 ? Volume1 : Volume2

  return (
    <div className="flex items-center gap-2">
      <button onClick={onToggleMute} title={silent ? 'Включить звук' : 'Выключить звук'}
        className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-sm font-semibold transition-colors ${
          soundBlocked ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'glass hover:bg-white/10 text-gray-200'
        }`}>
        <Icon className="w-4 h-4" />
        {soundBlocked && <span>Включить звук</span>}
      </button>
      <input type="range" min={0} max={100} value={silent ? 0 : volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        aria-label="Громкость"
        className="hidden sm:block w-24 accent-purple-500 cursor-pointer" />
    </div>
  )
}
