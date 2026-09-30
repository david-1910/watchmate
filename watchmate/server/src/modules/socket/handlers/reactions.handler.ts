import { getSocketMember, onEvent } from '../socket.guards'
import { AppServer, AppSocket } from '../socket.types'
import { SOCKET_EVENTS } from '../../../shared/constants/socketEvents'
import { REACTION_MAX_LENGTH } from '../../../shared/constants/limits'
import { isBoundedString, isObject } from '../../../shared/utils/validators'

type ReactionPayload = { emoji: string }

const parseReaction = (raw: unknown): ReactionPayload | null =>
  isObject(raw) && isBoundedString(raw.emoji, REACTION_MAX_LENGTH) ? { emoji: raw.emoji } : null

const handleReaction = (io: AppServer, socket: AppSocket, { emoji }: ReactionPayload): void => {
  const member = getSocketMember(socket)
  if (!member) return
  io.to(socket.data.roomId).emit(SOCKET_EVENTS.REACTION, { userId: member.userId, userName: member.userName, emoji })
}

export const registerReactionsHandlers = (io: AppServer, socket: AppSocket): void => {
  onEvent(socket, SOCKET_EVENTS.REACTION, parseReaction, (data) => handleReaction(io, socket, data))
}
