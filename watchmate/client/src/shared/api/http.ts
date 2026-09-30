import { API_BASE_URL } from '../config'
import { ApiError, API_ERROR_CODE } from './errors'

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } }

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type ApiClientOptions = {
  // Префикс пути относительно API_BASE_URL, например `/rooms/<id>`
  basePath?: string
  // Токен для заголовка Authorization: Bearer <token>
  getToken?: () => string | null
  // Вызывается перед выбросом ошибки с кодом UNAUTHORIZED
  onUnauthorized?: () => void
}

const NETWORK_ERROR_MESSAGE = 'Нет соединения с сервером'

const parseEnvelope = async <T>(res: Response): Promise<Envelope<T> | null> => {
  try {
    return (await res.json()) as Envelope<T>
  } catch {
    return null
  }
}

export const createApiClient = ({
  basePath = '',
  getToken,
  onUnauthorized,
}: ApiClientOptions = {}) => {
  const request = async <T>(
    method: Method,
    path: string,
    body?: unknown
  ): Promise<T> => {
    const headers: Record<string, string> = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const token = getToken?.()
    if (token) headers.Authorization = `Bearer ${token}`

    let res: Response
    try {
      res = await fetch(`${API_BASE_URL}${basePath}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch {
      throw new ApiError(0, null, NETWORK_ERROR_MESSAGE)
    }

    const envelope = await parseEnvelope<T>(res)
    if (envelope?.success) return envelope.data

    const error = envelope && !envelope.success ? envelope.error : null
    if (error?.code === API_ERROR_CODE.UNAUTHORIZED) onUnauthorized?.()
    throw new ApiError(
      res.status,
      error?.code ?? null,
      error?.message ?? res.statusText
    )
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

// Клиент без авторизации — для публичных эндпоинтов
export const http = createApiClient()
