// Единственная точка доступа к sessionStorage (CONTRACT.md, раздел 7):
// userName, hostToken_{roomId}, memberToken_{roomId}
const hostTokenKey = (roomId: string) => `hostToken_${roomId}`
const memberTokenKey = (roomId: string) => `memberToken_${roomId}`

// Подписчики на смену memberToken — чтобы UI сразу реагировал на UNAUTHORIZED
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

export const session = {
  getUserName: (): string | null => sessionStorage.getItem('userName'),
  setUserName: (name: string): void => sessionStorage.setItem('userName', name),

  getHostToken: (roomId: string): string | null =>
    sessionStorage.getItem(hostTokenKey(roomId)),
  setHostToken: (roomId: string, token: string): void =>
    sessionStorage.setItem(hostTokenKey(roomId), token),
  clearHostToken: (roomId: string): void =>
    sessionStorage.removeItem(hostTokenKey(roomId)),

  getMemberToken: (roomId: string): string | null =>
    sessionStorage.getItem(memberTokenKey(roomId)),
  setMemberToken: (roomId: string, token: string): void => {
    sessionStorage.setItem(memberTokenKey(roomId), token)
    notify()
  },
  clearMemberToken: (roomId: string): void => {
    if (sessionStorage.getItem(memberTokenKey(roomId)) === null) return
    sessionStorage.removeItem(memberTokenKey(roomId))
    notify()
  },

  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
