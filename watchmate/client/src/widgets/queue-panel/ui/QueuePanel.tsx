import { Check, GripVertical, ListPlus, Play, X } from 'lucide-react'
import { LinkInput } from '@/shared/ui'
import { validateVideoLink } from '@/shared/lib'
import type { QueueItem, Suggestion } from '@/entities/room'

type Props = {
  draft: string
  onDraftChange: (value: string) => void
  onAdd: (url: string) => void
  onPlayNow: (url: string) => void
  queue: QueueItem[]
  onRemove: (id: string) => void
  onPlay: (id: string) => void
  dragOverIndex: number | null
  onDragStart: (i: number) => void
  onDragOver: (i: number) => void
  onDragEnd: () => void
  suggestions: Suggestion[]
  onAcceptSuggestion: (id: string) => void
  onRejectSuggestion: (id: string) => void
}

const ICON_BTN = 'p-1.5 rounded-lg transition-colors'

// Очередь хоста: сначала решения по предложениям, затем добавление и порядок
export const QueuePanel = ({
  draft, onDraftChange, onAdd, onPlayNow, queue, onRemove, onPlay,
  dragOverIndex, onDragStart, onDragOver, onDragEnd,
  suggestions, onAcceptSuggestion, onRejectSuggestion,
}: Props) => (
  <div className="w-full h-full flex flex-col min-h-0 gap-4 overflow-y-auto">
    {suggestions.length > 0 && (
      <section className="flex flex-col gap-2 shrink-0">
        <h4 className="text-sm font-semibold text-purple-200">Предложения зрителей · {suggestions.length}</h4>
        {suggestions.map((s) => (
          <div key={s.id} className="rounded-xl p-2.5 bg-purple-500/10 border border-purple-500/30">
            <p className="text-xs text-purple-300 mb-1">{s.suggestedBy}</p>
            <p className="text-sm truncate mb-2">{s.title}</p>
            <div className="flex gap-2">
              <button onClick={() => onAcceptSuggestion(s.id)}
                className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 transition-colors">
                <Check className="w-3.5 h-3.5" />
                Принять
              </button>
              <button onClick={() => onRejectSuggestion(s.id)}
                className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold glass hover:bg-white/10 transition-colors">
                <X className="w-3.5 h-3.5" />
                Отклонить
              </button>
            </div>
          </div>
        ))}
      </section>
    )}

    <section className="flex flex-col gap-2 shrink-0">
      <h3 className="text-lg font-bold">Очередь</h3>
      <LinkInput value={draft} onChange={onDraftChange} placeholder="Ссылка на YouTube или Rutube" validate={validateVideoLink}
        actions={[
          { label: 'В очередь', icon: <ListPlus className="w-4 h-4" />, onClick: onAdd, primary: true },
          { label: 'Смотреть сейчас', icon: <Play className="w-4 h-4" />, onClick: onPlayNow },
        ]} />
    </section>

    <section className="flex flex-col gap-2 min-h-0">
      {queue.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Очередь пуста — добавьте видео выше</p>
      ) : (
        <>
          <p className="text-xs text-gray-500">Перетащите, чтобы изменить порядок</p>
          {queue.map((item, index) => (
            <div key={item.id} draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => { e.preventDefault(); onDragOver(index) }}
              onDragEnd={onDragEnd}
              className={`glass rounded-xl p-2 flex items-center gap-2 cursor-grab ${dragOverIndex === index ? 'ring-2 ring-purple-500' : ''}`}>
              <GripVertical className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-purple-400 text-sm font-bold w-4 shrink-0">{index + 1}</span>
              <span className="flex-1 text-sm truncate">{item.title}</span>
              <button onClick={() => onPlay(item.id)} className={`${ICON_BTN} hover:bg-green-500/30 text-green-400`} title="Смотреть сейчас">
                <Play className="w-4 h-4" />
              </button>
              <button onClick={() => onRemove(item.id)} className={`${ICON_BTN} hover:bg-red-500/30 text-red-400`} title="Убрать из очереди">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </>
      )}
    </section>
  </div>
)
