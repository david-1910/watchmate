import { useState, type ReactNode } from 'react'

export type LinkAction = {
  label: string
  icon?: ReactNode
  onClick: (value: string) => void
  primary?: boolean
}

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  actions: LinkAction[]
  // Возвращает текст ошибки или null; действия выполняются только для валидного значения
  validate?: (value: string) => string | null
  // row — поле и кнопки в одну строку (широкие места), stacked — кнопки под полем (сайдбар)
  layout?: 'row' | 'stacked'
}

// Поле ссылки с одним или несколькими действиями; Enter выполняет первое
export const LinkInput = ({ value, onChange, placeholder, actions, validate, layout = 'stacked' }: Props) => {
  const [error, setError] = useState<string | null>(null)

  const run = (action: LinkAction) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const problem = validate?.(trimmed) ?? null
    setError(problem)
    if (!problem) action.onClick(trimmed)
  }

  const buttons = (
    <div className={`flex gap-2 ${layout === 'row' ? 'shrink-0' : ''}`}>
      {actions.map((a) => (
        <button key={a.label} onClick={() => run(a)} disabled={!value.trim()}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            a.primary ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'glass hover:bg-white/10 text-gray-200'
          }`}>
          {a.icon}
          {a.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className={`flex gap-2 ${layout === 'row' ? 'flex-col sm:flex-row' : 'flex-col'}`}>
        <input type="url" inputMode="url" placeholder={placeholder} value={value}
          onChange={(e) => { onChange(e.target.value); setError(null) }}
          onKeyDown={(e) => { if (e.key === 'Enter' && actions[0]) run(actions[0]) }}
          className={`flex-1 min-w-0 bg-white/5 border rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors ${
            error ? 'border-red-500/60' : 'border-white/10 focus:border-purple-500/60'
          }`} />
        {buttons}
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  )
}
