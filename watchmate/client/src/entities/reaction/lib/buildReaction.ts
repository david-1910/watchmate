import type { Reaction } from '../model/types'
import {
  REACTION_LEFT_MIN,
  REACTION_LEFT_RANGE,
  REACTION_DURATION_BASE,
  REACTION_DURATION_VARIANCE,
} from '../config/animation'

// Случайная позиция и траектория, чтобы реакции не накладывались друг на друга
export const buildReaction = (emoji: string, userName: string): Reaction => ({
  id: performance.now() + Math.random() * 10000,
  userName,
  emoji,
  left: Math.random() * REACTION_LEFT_RANGE + REACTION_LEFT_MIN,
  direction: Math.random() > 0.5 ? 'left' : 'right',
  duration: REACTION_DURATION_BASE + Math.random() * REACTION_DURATION_VARIANCE,
})
