import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from '@/pages/home'
import { RoomPage } from '@/pages/room'

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* /room-<roomId>: префикс разбирает parseRoomSlug на странице */}
      <Route path="/:roomSlug" element={<RoomPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)
