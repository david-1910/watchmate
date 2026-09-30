export type RequestType = 'pause' | 'play' | 'change-video'

export type PlaybackRequest = {
  id: string
  fromUserId: string
  fromUserName: string
  type: RequestType
  videoUrl?: string
}

// Ответ хоста отправителю запроса
export type RequestAnswer = {
  requestId: string
  type: RequestType
  accepted: boolean
}

// Мой последний запрос: ждём ответа или уже знаем решение хоста
export type MyRequest =
  | { status: 'pending'; type: RequestType }
  | { status: 'answered'; type: RequestType; accepted: boolean }
