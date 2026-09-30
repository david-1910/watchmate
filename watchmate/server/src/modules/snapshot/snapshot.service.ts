import { membersService } from '../members/members.service'
import { hostService } from '../members/host.service'
import { readyService } from '../ready/ready.service'
import { playbackService } from '../playback/playback.service'
import { queueService } from '../queue/queue.service'
import { suggestionsService } from '../suggestions/suggestions.service'
import { chatService } from '../chat/chat.service'
import { Room, RoomSnapshot } from '../../shared/types'

// Полное состояние комнаты для участника (CONTRACT.md: RoomSnapshot)
const build = (room: Room, userId: string): RoomSnapshot => ({
  room: { id: room.id, joinCode: room.joinCode, isPrivate: room.isPrivate, createdAt: room.createdAt.toISOString() },
  me: { userId },
  users: membersService.getUsers(room.id),
  hostId: hostService.getHostId(room.id),
  ready: readyService.getState(room.id),
  video: playbackService.getVideo(room.id),
  playback: playbackService.getPosition(room.id),
  queue: queueService.getQueue(room.id),
  suggestions: suggestionsService.getSuggestions(room.id),
  lastSeq: chatService.getLastSeq(room.id),
})

export const snapshotService = { build }
