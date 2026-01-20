const API_URL = 'http://localhost:3001'

export async function createRoom(): Promise<{ id: string }> {
  const response = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
  })
  return response.json()
}

export async function getRoom(
  id: string
): Promise<{ id: string; createdAt: string } | null> {
  const response = await fetch(`${API_URL}/rooms/${id}`)

  if (response.ok) {
    return response.json()
  }
  return null
}
