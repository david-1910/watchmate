export type Reaction = {
  id: number
  userName: string
  emoji: string
  left: number
  direction: 'left' | 'right'
  duration: number
}
