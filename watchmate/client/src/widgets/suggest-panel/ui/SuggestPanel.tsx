import type { QueueItem } from '../../../shared/types'

type Props = {
  queue: QueueItem[]
  suggestInput: string
  onSuggestInputChange: (v: string) => void
  onSuggest: () => void
}

export const SuggestPanel = ({ queue, suggestInput, onSuggestInputChange, onSuggest }: Props) => (
  <aside className="w-64 glass-card rounded-2xl p-4 flex flex-col min-h-0">
    <h3 className="text-lg font-bold mb-3">Предложить видео</h3>

    <div className="flex gap-2 mb-3">
      <input type="text" placeholder="YouTube URL..." value={suggestInput}
        onChange={(e) => onSuggestInputChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSuggest()}
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
      <button onClick={onSuggest} className="px-3 py-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-sm transition-colors">+</button>
    </div>
    <p className="text-xs text-gray-500">Хост увидит ваше предложение</p>

    {queue.length > 0 && (
      <>
        <div className="border-t border-white/10 my-3" />
        <h4 className="text-sm font-bold text-gray-400 mb-2">Очередь ({queue.length})</h4>
        <div className="flex-1 overflow-y-auto space-y-2">
          {queue.map((item, index) => (
            <div key={item.id} className="glass rounded-lg p-2 flex items-center gap-2">
              <span className="text-purple-400 text-sm font-bold">{index + 1}</span>
              <span className="flex-1 text-sm truncate">{item.title}</span>
            </div>
          ))}
        </div>
      </>
    )}
  </aside>
)
