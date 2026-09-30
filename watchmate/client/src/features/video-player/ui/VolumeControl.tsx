import { Volume1, Volume2 } from 'lucide-react'

type Props = {
  volume: number
  onVolumeChange: (value: number) => void
}

export const VolumeControl = ({ volume, onVolumeChange }: Props) => {
  const Icon = volume < 50 ? Volume1 : Volume2

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl glass text-gray-200">
        <Icon className="w-4 h-4" />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        aria-label="Громкость"
        className="hidden sm:block w-24 accent-purple-500 cursor-pointer"
      />
    </div>
  )
}
