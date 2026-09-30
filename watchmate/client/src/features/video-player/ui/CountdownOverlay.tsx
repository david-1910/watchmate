import { Play } from 'lucide-react'
export const CountdownOverlay = ({ count }: { count: number }) => (
  <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
    <span className="text-9xl font-bold text-glow">
      {count === 0 ? <Play className="w-28 h-28 fill-current" /> : count}
    </span>
  </div>
)
