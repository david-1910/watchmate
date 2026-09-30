import { REACTION_EMOJIS } from '../config/emojis'

type Props = {
  onSend: (emoji: string) => void
}

// Реакции в панели под видео — не перекрывают субтитры и элементы плеера
export const ReactionBar = ({ onSend }: Props) => (
  <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-start gap-0.5 overflow-x-auto no-scrollbar" role="group" aria-label="Реакции">
    {REACTION_EMOJIS.map((emoji) => (
      <button key={emoji} onClick={() => onSend(emoji)}
        className="shrink-0 w-9 h-9 rounded-xl text-xl hover:bg-white/10 active:bg-white/20 transition-colors">
        {emoji}
      </button>
    ))}
  </div>
)

