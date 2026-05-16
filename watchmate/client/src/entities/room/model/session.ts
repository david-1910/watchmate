export const session = {
  getUserName: (): string | null => sessionStorage.getItem('userName'),
  setUserName: (name: string): void => sessionStorage.setItem('userName', name),
  removeUserName: (): void => sessionStorage.removeItem('userName'),

  getHostToken: (roomId: string): string | null =>
    sessionStorage.getItem(`hostToken_${roomId}`),
  setHostToken: (roomId: string, token: string): void =>
    sessionStorage.setItem(`hostToken_${roomId}`, token),

  isPasswordVerified: (roomId: string): boolean =>
    !!sessionStorage.getItem(`passwordVerified_${roomId}`),
  setPasswordVerified: (roomId: string): void =>
    sessionStorage.setItem(`passwordVerified_${roomId}`, 'true'),
}
