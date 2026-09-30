import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Lock, RefreshCw, UserPlus } from 'lucide-react'
import { CopyButton, Portal } from '@/shared/ui'
import { useDismiss } from '@/shared/lib'
import { formatJoinCode, roomUrl } from '@/entities/room'

type Props = {
  roomId: string
  joinCode: string
  isHost: boolean
  isPrivate: boolean
  regeneratingCode: boolean
  onRegenerateCode: () => void
}

// Ссылка и код в одном месте; смена кода — только у хоста
export const InviteMenu = ({
  roomId,
  joinCode,
  isHost,
  isPrivate,
  regeneratingCode,
  onRegenerateCode,
}: Props) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const refs = useMemo(() => [buttonRef, menuRef], [])
  useDismiss(refs, close, open)
  const link = roomUrl(roomId)

  // Меню в Portal (не зависит от слоёв шапки), позиция — под кнопкой
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = buttonRef.current?.getBoundingClientRect()
      if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Пригласить</span>
      </button>

      {open && (
        <Portal>
          <div
            ref={menuRef}
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-modal w-[min(20rem,calc(100vw-1.5rem))] surface-floating rounded-2xl p-4 flex flex-col gap-4"
          >
            <div>
              <p className="font-semibold text-base">Пригласить друзей</p>
              {isPrivate && (
                <p className="text-xs text-gray-300 mt-1 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Комната приватная — сообщите друзьям пароль
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-300">Ссылка на комнату</span>
              <CopyButton
                text={link}
                title="Скопировать ссылку"
                className="justify-between min-w-0"
              >
                <span className="truncate text-sm text-white">
                  {link.replace(/^https?:\/\//, '')}
                </span>
              </CopyButton>
            </div>

            {joinCode && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-gray-300">
                  Код для входа с главной
                </span>
                <CopyButton
                  text={formatJoinCode(joinCode)}
                  title="Скопировать код"
                  className="justify-between"
                >
                  <code className="font-mono text-lg font-semibold tracking-widest text-white">
                    {formatJoinCode(joinCode)}
                  </code>
                </CopyButton>
              </div>
            )}

            {isHost && (
              <button
                onClick={onRegenerateCode}
                disabled={regeneratingCode}
                className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm text-gray-100 bg-white/5 border border-white/15 hover:bg-white/10 disabled:opacity-50 transition-colors"
                title="Старый код сразу перестанет работать, ссылка не изменится"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${regeneratingCode ? 'animate-spin' : ''}`}
                />
                Сменить код
              </button>
            )}
          </div>
        </Portal>
      )}
    </>
  )
}
