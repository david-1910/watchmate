import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from '../pages/home'
import { RoomPage } from '../pages/room'

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room:id" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export { Router }
