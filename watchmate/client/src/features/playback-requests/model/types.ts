export type RequestType = 'pause' | 'play' | 'change-video'

export type PlaybackRequest = {
  id: string
  fromUserId: string
  fromUserName: string
  type: RequestType
  videoUrl?: string
}
