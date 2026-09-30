import { Volume2, VolumeX } from 'lucide-react'

type Props = {
  muted: boolean
  // Браузер запустил видео без звука (политика автозапуска) — кнопка подсвечена и подписана
  soundBlocked: boolean
  onToggle: () => void
}

// Звук вкл/выкл. Громкость регулируется кнопками устройства — отдельного ползунка нет
export const SoundButton = ({ muted, soundBlocked, onToggle }: Props) => {
  const Icon = muted ? VolumeX : Volume2
  return (
    <button onClick={onToggle} title={muted ? 'Включить звук' : 'Выключить звук'}
      className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-sm font-semibold transition-colors ${
        soundBlocked ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'glass hover:bg-white/10 text-gray-200'
      }`}>
      <Icon className="w-4 h-4" />
      {soundBlocked && <span>Включить звук</span>}
    </button>
  )
}
