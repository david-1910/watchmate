import { useEffect, useRef } from 'react'

// Предотвращает переход экрана в спящий режим во время воспроизведения видео (Screen Wake Lock API)
export const useWakeLock = (enabled: boolean): void => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return
    }

    const requestLock = async () => {
      try {
        if (!wakeLockRef.current && document.visibilityState === 'visible') {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null
          })
        }
      } catch {
        // Игнорируем ошибку (например, при низком заряде батареи или неактивной вкладке)
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestLock()
      }
    }

    requestLock()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
        wakeLockRef.current = null
      }
    }
  }, [enabled])
}
