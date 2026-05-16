import type { RoomUser } from '../../../shared/types'
import { getAvatarColor } from '../../../shared/lib'

type Props = {
  users: RoomUser[]
  hostId: string | null
  mySocketId: string | null
  readyUsers: string[]
}

export const UsersPanel = ({ users, hostId, mySocketId, readyUsers }: Props) => (
  <div className="flex-1 overflow-y-auto">
    <div className="space-y-2">
      {users.map((user) => (
        <div key={user.userId} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
          readyUsers.includes(user.userId) ? 'bg-green-500/20 border border-green-500/30'
          : user.userId === hostId ? 'bg-yellow-500/20 border border-yellow-500/30'
          : 'glass'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
            user.userId === hostId ? 'bg-yellow-500/30' : getAvatarColor(user.userName)
          }`}>
            {user.userId === hostId ? '👑' : user.userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {user.userName}
              {user.userId === mySocketId && <span className="text-gray-500 text-xs ml-1">(вы)</span>}
            </div>
            <div className="text-xs text-gray-400">
              {user.userId === hostId ? 'Хост' : 'Зритель'}
              {readyUsers.includes(user.userId) && ' • ✓ Готов'}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)
