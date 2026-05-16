import { httpServer } from './app'
import { env } from './shared/config/env'

httpServer.listen(env.port, () => {
  console.log(`Сервер запущен: http://localhost:${env.port}`)
})
