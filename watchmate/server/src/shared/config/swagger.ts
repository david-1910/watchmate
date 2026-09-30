import path from 'path'
import swaggerJsdoc from 'swagger-jsdoc'
import { env } from './env'

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const arrayOf = (name: string) => ({ type: 'array', items: ref(name) })

// Успешный ответ с конвертом { success: true, data }
const successResponse = (description: string, data: object) => ({
  description,
  content: { 'application/json': { schema: { allOf: [ref('ApiSuccess'), { type: 'object', properties: { data } }] } } },
})

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ref('ApiError') } },
})

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WatchMate API',
      version: '2.0.0',
      description:
        'REST API для совместного просмотра (протокол v2, CONTRACT.md). Участник авторизуется Bearer memberToken, полученным в POST /rooms/{roomId}/members.',
    },
    servers: [{ url: `http://localhost:${env.port}/api/v1`, description: 'Development' }],
    tags: [
      { name: 'Rooms', description: 'Комнаты, поиск по коду, смена кода, снимок состояния' },
      { name: 'Members', description: 'Вход и выход участников, передача роли хоста' },
      { name: 'Chat', description: 'Сообщения чата с seq и идемпотентной отправкой' },
      { name: 'Video', description: 'Текущее видео комнаты (только хост)' },
      { name: 'Queue', description: 'Очередь видео. Мутации — только хост.' },
      { name: 'Suggestions', description: 'Предложения видео от участников. Принятие и отклонение — только хост.' },
      { name: 'Ready', description: 'Готовность и обратный отсчёт' },
    ],
    components: {
      securitySchemes: {
        MemberToken: { type: 'http', scheme: 'bearer', description: 'memberToken из POST /rooms/{roomId}/members' },
      },
      parameters: {
        RoomId: {
          in: 'path',
          name: 'roomId',
          required: true,
          description: 'UUID v4 в нижнем регистре; другой формат → 404',
          schema: { type: 'string', format: 'uuid' },
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: { success: { type: 'boolean', example: true }, data: { type: 'object' } },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: {
                  type: 'string',
                  enum: ['VALIDATION_ERROR', 'UNAUTHORIZED', 'WRONG_PASSWORD', 'FORBIDDEN', 'NOT_FOUND', 'RATE_LIMIT'],
                },
              },
            },
          },
        },
        CreatedRoom: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            joinCode: { type: 'string', example: 'ABC234' },
            hostToken: { type: 'string' },
            isPrivate: { type: 'boolean' },
          },
        },
        RoomInfo: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' }, isPrivate: { type: 'boolean' } },
        },
        JoinedMember: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            memberToken: { type: 'string' },
            isHost: { type: 'boolean' },
          },
        },
        RoomUser: {
          type: 'object',
          properties: { userId: { type: 'string' }, userName: { type: 'string' }, online: { type: 'boolean' } },
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            clientId: { type: 'string', format: 'uuid' },
            seq: { type: 'integer' },
            userId: { type: 'string' },
            userName: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        QueueItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            url: { type: 'string', example: 'https://youtu.be/dQw4w9WgXcQ' },
            title: { type: 'string' },
          },
        },
        Suggestion: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            url: { type: 'string' },
            title: { type: 'string' },
            suggestedBy: { type: 'string' },
            suggestedById: { type: 'string', description: 'userId' },
          },
        },
        PlaybackState: {
          type: 'object',
          properties: { isPlaying: { type: 'boolean' }, currentTime: { type: 'number' } },
        },
        ReadyState: {
          type: 'object',
          properties: { readyUsers: { type: 'array', items: { type: 'string' } }, allReady: { type: 'boolean' } },
        },
        RoomSnapshot: {
          type: 'object',
          properties: {
            room: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                joinCode: { type: 'string' },
                isPrivate: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
            me: { type: 'object', properties: { userId: { type: 'string' } } },
            users: { ...arrayOf('RoomUser'), description: 'Хост первым' },
            hostId: { type: 'string', nullable: true },
            ready: ref('ReadyState'),
            video: { type: 'string', description: "'' — видео нет" },
            playback: { allOf: [ref('PlaybackState')], nullable: true },
            queue: arrayOf('QueueItem'),
            suggestions: arrayOf('Suggestion'),
            lastSeq: { type: 'integer', description: '0, если сообщений нет' },
          },
        },
      },
      responses: {
        ValidationError: errorResponse('VALIDATION_ERROR — некорректное тело или параметры'),
        Unauthorized: errorResponse('UNAUTHORIZED — токен отсутствует, неизвестен или истёк'),
        WrongPassword: errorResponse('WRONG_PASSWORD — неверный пароль комнаты'),
        Forbidden: errorResponse('FORBIDDEN — действие только для хоста'),
        NotFound: errorResponse('NOT_FOUND'),
        RateLimit: errorResponse('RATE_LIMIT — слишком много запросов'),
        Video: successResponse('Текущее видео', { type: 'object', properties: { video: { type: 'string' } } }),
        Queue: successResponse('Очередь', arrayOf('QueueItem')),
        Played: successResponse('Новое текущее видео и очередь', {
          type: 'object',
          properties: { video: { type: 'string' }, queue: arrayOf('QueueItem') },
        }),
        Suggestions: successResponse('Предложения', arrayOf('Suggestion')),
      },
    },
  },
  // JSDoc-блоки @swagger в роутерах (.ts под tsx в npm run dev, .js после сборки)
  apis: [path.join(__dirname, '../../modules/**/*.router.{ts,js}').replace(/\\/g, '/')],
}

export const swaggerSpec = swaggerJsdoc(options)
