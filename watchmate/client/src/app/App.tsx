import { StrictMode } from 'react'
import { AppRouter } from './router'
import './styles/index.css'

export const App = () => (
  <StrictMode>
    <AppRouter />
  </StrictMode>
)
