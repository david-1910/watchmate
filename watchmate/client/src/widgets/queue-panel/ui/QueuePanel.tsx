import type { QueueItem, Suggestion } from '../../../shared/types'

type Props = {
  queue: QueueItem[]
  suggestions: Suggestion[]
  queueInput: string
  onQueueInputChange: (v: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onPlay: (id: string) => void
  onNext: () => void
  dragOverIndex: number | null
  onDragStart: (i: number) => void
  onDragOver: (i: number) => void
  onDragEnd: () => void
  onAcceptSuggestion: (id: string) => void
  onRejectSuggestion: (id: string) => void
  autoplay: boolean
  onToggleAutoplay: () => void
}

export const QueuePanel = ({
  queue, suggestions, queueInput, onQueueInputChange, onAdd, onRemove, onPlay, onNext,
  dragOverIndex, onDragStart, onDragOver, onDragEnd,
  onAcceptSuggestion, onRejectSuggestion, autoplay, onToggleAutoplay,
}: Props) => (
  <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
    <h3 className="text-lg font-bold mb-3 shrink-0">Очередь</h3>

    <div className="flex gap-2 mb-3 shrink-0">
      <input type="text" placeholder="YouTube URL..." value={queueInput}
        onChange={(e) => onQueueInputChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
      <button onClick={onAdd} className="px-3 py-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-sm transition-colors">+</button>
    </div>

    <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
      {queue.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Очередь пуста</p>
      ) : (
        queue.map((item, index) => (
          <div key={item.id} draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => { e.preventDefault(); onDragOver(index) }}
            onDragEnd={onDragEnd}
            className={`glass rounded-lg p-2 flex items-center gap-2 cursor-grab ${dragOverIndex === index ? 'border-2 border-purple-500' : ''}`}>
            <span className="text-purple-400 text-sm font-bold">{index + 1}</span>
            <span className="flex-1 text-sm truncate">{item.title}</span>
            <button onClick={() => onPlay(item.id)} className="p-1 hover:bg-green-500/30 rounded text-green-400" title="Воспроизвести">▶</button>
            <button onClick={() => onRemove(item.id)} className="p-1 hover:bg-red-500/30 rounded text-red-400" title="Удалить">✕</button>
          </div>
        ))
      )}
    </div>

    {suggestions.length > 0 && (
      <>
        <div className="border-t border-white/10 my-3 shrink-0" />
        <h4 className="text-sm font-bold text-gray-400 mb-2 shrink-0">Предложения</h4>
        <div className="space-y-2 shrink-0">
          {suggestions.map((s) => (
            <div key={s.id} className="glass rounded-lg p-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-purple-400">{s.suggestedBy}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm truncate">{s.title}</span>
                <button onClick={() => onAcceptSuggestion(s.id)} className="p-1 hover:bg-green-500/30 rounded text-green-400" title="Принять">✓</button>
                <button onClick={() => onRejectSuggestion(s.id)} className="p-1 hover:bg-red-500/30 rounded text-red-400" title="Отклонить">✕</button>
              </div>
            </div>
          ))}
        </div>
      </>
    )}

    <div className="border-t border-white/10 mt-3 pt-3 flex gap-2 shrink-0">
      <button onClick={onToggleAutoplay} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${autoplay ? 'bg-green-500/30 text-green-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
        {autoplay ? '⏸ Авто' : '▶ Авто'}
      </button>
      <button onClick={onNext} disabled={queue.length === 0}
        className="flex-1 py-2 bg-purple-500/30 hover:bg-purple-500/50 disabled:opacity-50 disabled:hover:bg-purple-500/30 rounded-lg text-sm transition-colors">
        Далее →
      </button>
    </div>
  </div>
)
