import 'dotenv/config'

const rawClientUrls = process.env.CLIENT_URL ?? 'http://localhost:5173'

export const env = {
  port: Number(process.env.PORT) || 3001,
  clientUrls: rawClientUrls.split(',').map((u) => u.trim()),
} as const
