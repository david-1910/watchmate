// CONTRACT.md, раздел 7: повторы отправки с backoff 1 с, 2 с, 4 с
export const MESSAGE_RETRY_DELAYS_MS = [1000, 2000, 4000] as const
