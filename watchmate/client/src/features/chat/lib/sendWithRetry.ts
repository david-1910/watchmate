import { isRetryableError } from '@/shared/api'

// Повторяет запрос только при сетевой ошибке или 5xx, с заданными паузами
export const sendWithRetry = async <T>(
  send: () => Promise<T>,
  delaysMs: readonly number[],
  wait: (ms: number) => Promise<void>
): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await send()
    } catch (err) {
      if (!isRetryableError(err) || attempt >= delaysMs.length) throw err
      await wait(delaysMs[attempt])
    }
  }
}
