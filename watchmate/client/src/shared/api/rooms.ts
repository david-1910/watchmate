const API_URL = `http://${window.location.hostname}:3001`

export async function createRoom(options?: { isPrivate?: boolean; password?: string }): Promise<{ id: string; hostToken: string; isPrivate: boolean }> {
  const response = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options || {})
  })
  return response.json()
}

export async function getRoom(
  id: string
): Promise<{ id: string; createdAt: string; isPrivate: boolean } | null> {
  const response = await fetch(`${API_URL}/rooms/${id}`)

  if (response.ok) {
    return response.json()
  }
  return null
}

export async function verifyRoomPassword(
  id: string,
  password: string
): Promise<boolean> {
  const response = await fetch(`${API_URL}/rooms/${id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  return response.ok
}
