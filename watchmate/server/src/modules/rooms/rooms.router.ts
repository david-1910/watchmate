import { Router, Request, Response } from 'express'
import { roomsService } from './rooms.service'

const router = Router()

router.post('/', (req: Request, res: Response) => {
  const { isPrivate = false, password } = req.body ?? {}
  const room = roomsService.create({ isPrivate: !!isPrivate, password })
  res.json(room)
})

router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string
  const room = roomsService.findById(id)
  if (!room) {
    res.status(404).json({ error: 'Комната не найдена' })
    return
  }
  res.json({ id: room.id, createdAt: room.createdAt, isPrivate: room.isPrivate })
})

router.post('/:id/verify', (req: Request, res: Response) => {
  const { password } = req.body ?? {}
  const id = req.params.id as string
  const room = roomsService.findById(id)

  if (!room) {
    res.status(404).json({ error: 'Комната не найдена' })
    return
  }

  if (roomsService.verifyPassword(id, password)) {
    res.json({ success: true })
  } else {
    res.status(401).json({ error: 'Неверный пароль' })
  }
})

export { router as roomsRouter }
