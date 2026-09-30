import { SearchX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui'

type Props = {
  title?: string
  description?: string
}

export const RoomNotFound = ({
  title = 'Комната не найдена',
  description = 'Комната не существует или была закрыта',
}: Props) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-app text-white flex flex-col items-center justify-center">
      <div className="glass-card rounded-3xl p-10 flex flex-col items-center">
        <SearchX className="w-16 h-16 mb-4 text-purple-300" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-gray-400 mb-6 text-center">{description}</p>
        <Button onClick={() => navigate('/')}>На главную</Button>
      </div>
    </div>
  )
}
