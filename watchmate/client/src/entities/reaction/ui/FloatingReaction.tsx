import type { Reaction } from '../model/types'

export const FloatingReaction = ({ reaction }: { reaction: Reaction }) => (
  <div
    className="absolute text-3xl pointer-events-none"
    style={{
      left: `${reaction.left}%`,
      bottom: '10px',
      willChange: 'transform, opacity',
      animation: `float-up-${reaction.direction} ${reaction.duration}s ease-out forwards`,
    }}
  >
    {reaction.emoji}
  </div>
)
