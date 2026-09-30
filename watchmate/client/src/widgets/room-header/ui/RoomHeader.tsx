import { ArrowLeft, Crown } from 'lucide-react'
import { getAvatarColor } from '@/entities/user'
import type { RoomUser } from '@/entities/room'
import { InviteMenu } from './InviteMenu'

type Props = {
  roomId: string
  joinCode: string
  users: RoomUser[]
  hostId: string | null
  isHost: boolean
  isPrivate: boolean
  regeneratingCode: boolean
  onRegenerateCode: () => void
  onShowUsers: () => void
  onExit: () => void
}

const MAX_AVATARS = 3

export const RoomHeader = ({
  roomId, joinCode, users, hostId, isHost, isPrivate,
  regeneratingCode, onRegenerateCode, onShowUsers, onExit,
}: Props) => {
  const online = users.filter((u) => u.online)

  return (
    <header className="glass rounded-2xl px-3 md:px-5 py-1.5 md:py-2.5 flex justify-between items-center shrink-0 gap-2">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <button onClick={onExit} title="Выйти из комнаты"
          className="flex items-center justify-center w-9 h-9 rounded-xl glass hover:bg-white/10 transition-all shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <img src="/logo-watchmate.png" alt="WatchMate" className="h-7 w-7 md:h-9 md:w-9 object-contain shrink-0" />
        <h1 className="hidden lg:block text-xl font-bold text-glow">WatchMate</h1>
        {isHost && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-yellow-500/15 text-yellow-300">
            <Crown className="w-3.5 h-3.5" />
            Вы хост
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Аватары ведут во вкладку участников */}
        <button onClick={onShowUsers} title="Участники"
          className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-xl hover:bg-white/10 transition-colors">
          <span className="flex -space-x-2">
            {online.slice(0, MAX_AVATARS).map((user) => (
              <span key={user.userId} title={user.userName}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-gray-900 ${
                  user.userId === hostId ? 'bg-yellow-500/50' : getAvatarColor(user.userName)
                }`}>
                {user.userId === hostId ? <Crown className="w-3.5 h-3.5 text-yellow-200" /> : user.userName.charAt(0).toUpperCase()}
              </span>
            ))}
          </span>
          <span className="text-sm text-gray-300">{online.length}</span>
        </button>

        <InviteMenu roomId={roomId} joinCode={joinCode} isHost={isHost} isPrivate={isPrivate}
          regeneratingCode={regeneratingCode} onRegenerateCode={onRegenerateCode} />
      </div>
    </header>
  )
}
