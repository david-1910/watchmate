import { httpServer } from './app'

const PORT = 3001

httpServer.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`)
})
