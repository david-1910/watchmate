import { useParams } from 'react-router-dom'

function RoomPage() {
  const { id } = useParams()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">WatchMate</h1>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Комната:</span>
          <code className="bg-gray-800 px-3 py-1 rounded">{id}</code>
        </div>
      </header>

      <main className="flex gap-8">
        <div className="flex-1">
          <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
            <p className="text-gray-500">Здесь будет синхронизация</p>
          </div>
        </div>

        <aside className="w-80 bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-4">Чат</h2>
          <p className="text-gray-500">Скоро будет...</p>
        </aside>
      </main>
    </div>
  )
}

export { RoomPage }
