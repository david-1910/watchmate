import { API_BASE_URL } from '../config'

export const http = {
  get: <T>(path: string): Promise<T> =>
    fetch(`${API_BASE_URL}${path}`).then((r) => {
      if (!r.ok) throw new Error(r.statusText)
      return r.json() as Promise<T>
    }),

  post: <T>(path: string, body?: unknown): Promise<T> =>
    fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((r) => {
      if (!r.ok) throw new Error(r.statusText)
      return r.json() as Promise<T>
    }),
}
