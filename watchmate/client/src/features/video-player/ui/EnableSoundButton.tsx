import { VolumeX } from 'lucide-react'

// Показывается, когда браузер запустил видео только без звука (политика автовоспроизведения)
export const EnableSoundButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick}
    className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl
      bg-purple-600/90 hover:bg-purple-500 shadow-lg shadow-purple-900/40 text-sm font-semibold transition-colors">
    <VolumeX className="w-4 h-4" />
    Включить звук
  </button>
)
