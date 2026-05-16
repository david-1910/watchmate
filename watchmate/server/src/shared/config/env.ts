import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT) || 3001,
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
} as const
