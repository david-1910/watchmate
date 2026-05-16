import swaggerJsdoc from 'swagger-jsdoc'
import { env } from './env'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WatchMate API',
      version: '1.0.0',
      description: 'REST API для совместного просмотра видео. Аутентификация хоста — Bearer токен, полученный при создании комнаты.',
    },
    servers: [
      { url: `http://localhost:${env.port}/api/v1`, description: 'Development' },
    ],
    tags: [
      {
        name: 'Rooms',
        description: 'Создание комнат, получение информации и проверка пароля',
      },
      {
        name: 'Queue',
        description: 'Очередь видео в комнате — добавление, удаление, воспроизведение, сортировка. Мутации доступны только хосту (Bearer токен).',
      },
      {
        name: 'Suggestions',
        description: 'Предложения видео от участников комнаты. Принятие/отклонение — только хост.',
      },
    ],
    components: {
      securitySchemes: {
        HostToken: {
          type: 'http',
          scheme: 'bearer',
          description: 'hostToken, полученный при создании комнаты',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
        Room: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'ABC123' },
            createdAt: { type: 'string', format: 'date-time' },
            isPrivate: { type: 'boolean' },
          },
        },
        RoomUser: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            userName: { type: 'string' },
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
            suggestedById: { type: 'string' },
          },
        },
      },
    },
  },
  apis: [],
}

export const swaggerSpec = swaggerJsdoc(options)
