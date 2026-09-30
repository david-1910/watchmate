import { Crown, Check } from 'lucide-react'
import { getAvatarColor } from '@/entities/user'
import type { RoomUser } from '@/entities/room'
import { TransferHostButton } from '@/features/transfer-host'

type Props = {
  users: RoomUser[]
  hostId: string | null
  myUserId: string | null
  readyUsers: string[]
  onTransferHost: (userId: string) => void
}

export const UsersPanel = ({ users, hostId, myUserId, readyUsers, onTransferHost }: Props) => {
  const isHost = !!myUserId && myUserId === hostId

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-2">
        {users.map((user) => {
          const isUserHost = user.userId === hostId
          const isReady = readyUsers.includes(user.userId)

          return (
            <div
              key={user.userId}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${user.online ? '' : 'opacity-50'} ${
                isReady
                  ? 'bg-green-500/20 border border-green-500/30'
                  : isUserHost
                    ? 'bg-yellow-500/20 border border-yellow-500/30'
                    : 'glass'
              }`}
            >
              <div
                className={`relative w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                  isUserHost ? 'bg-yellow-500/30' : getAvatarColor(user.userName)
                }`}
              >
                {isUserHost ? <Crown className="w-5 h-5 text-yellow-300" /> : user.userName.charAt(0).toUpperCase()}
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${user.online ? 'bg-green-400' : 'bg-gray-500'}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {user.userName}
                  {user.userId === myUserId && (
                    <span className="text-gray-500 text-xs ml-1">(вы)</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {isUserHost ? 'Хост' : 'Зритель'}
                  {isReady && <> • <Check className="inline w-3 h-3 text-green-400 -mt-0.5" /> Готов</>}
                  {!user.online && ' • не в сети'}
                </div>
              </div>
              {/* Передать хоста можно только участнику онлайн (CONTRACT.md, раздел 5) */}
              {isHost && user.userId !== myUserId && user.online && (
                <TransferHostButton onTransfer={() => onTransferHost(user.userId)} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
