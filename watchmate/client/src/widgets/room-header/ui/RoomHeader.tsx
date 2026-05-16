import { useState } from 'react'
import type { RoomUser } from '../../../shared/types'
import { getAvatarColor } from '../../../shared/lib'

type Props = {
  roomId: string
  users: RoomUser[]
  hostId: string | null
  isPrivate: boolean
  onExit: () => void
}

export const RoomHeader = ({ roomId, users, hostId, isPrivate, onExit }: Props) => {
  const [copied, setCopied] = useState(false)

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="glass rounded-2xl px-3 md:px-6 py-1.5 landscape:py-1 md:py-3 flex justify-between items-center shrink-0">
      <div className="flex items-center gap-2 md:gap-3">
        <button onClick={onExit}
          className="flex items-center justify-center w-9 h-9 rounded-xl glass hover:bg-white/10 transition-all shrink-0" title="Назад">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <img src="/logo-watchmate.png" alt="WatchMate" className="h-7 w-7 landscape:h-6 landscape:w-6 md:h-10 md:w-10 object-contain shrink-0" />
        <h1 className="hidden sm:block text-xl md:text-2xl font-bold text-glow">WatchMate</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {users.slice(0, 3).map((user) => (
              <div key={user.userId}
                className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-gray-900 ${user.userId === hostId ? 'bg-yellow-500/50' : getAvatarColor(user.userName)}`}
                title={user.userName}>
                {user.userId === hostId ? '👑' : user.userName.charAt(0).toUpperCase()}
              </div>
            ))}
            {users.length > 3 && (
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-600 border-2 border-gray-900">
                +{users.length - 3}
              </div>
            )}
          </div>
        </div>

        <button onClick={copyRoomCode}
          className="flex items-center gap-1.5 md:gap-2 glass px-2 md:px-3 py-1.5 md:py-2 rounded-xl hover:bg-white/10 transition-all group" title="Нажмите чтобы скопировать">
          {isPrivate && (
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
          <span className="hidden sm:inline text-gray-400 text-sm">Комната:</span>
          <code className="font-mono text-xs md:text-sm text-white group-hover:text-purple-300 transition-colors">{roomId}</code>
          {copied ? (
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 group-hover:text-purple-300 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
