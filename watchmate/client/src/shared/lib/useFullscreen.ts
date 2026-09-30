import { useCallback, useEffect, useRef, useState } from 'react'

<<<<<<< HEAD
// lock/unlock есть не во всех браузерах (нет в iOS Safari) и не во всех версиях lib.dom
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>
  unlock?: () => void
}

const orientation = (): LockableOrientation | undefined =>
  typeof screen !== 'undefined' ? (screen.orientation as LockableOrientation | undefined) : undefined

// Сенсорный экран — телефон или планшет: там в полном экране поворачиваем в альбомную ориентацию
const isTouchDevice = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

=======
>>>>>>> 75d61a1b01b63716100cf7cfc41b468a6aaf49b4
// Полноэкранный режим для элемента; supported=false там, где его нет (iOS Safari)
export const useFullscreen = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)
  const [active, setActive] = useState(false)
  const supported = typeof document !== 'undefined' && !!document.fullscreenEnabled

  useEffect(() => {
<<<<<<< HEAD
    const onChange = () => {
      const isActive = !!ref.current && document.fullscreenElement === ref.current
      setActive(isActive)
      // Вышли из полного экрана (кнопкой, жестом, «назад») — отпускаем ориентацию
      if (!isActive) orientation()?.unlock?.()
    }
=======
    const onChange = () => setActive(!!ref.current && document.fullscreenElement === ref.current)
>>>>>>> 75d61a1b01b63716100cf7cfc41b468a6aaf49b4
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

<<<<<<< HEAD
  const toggle = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {})
      return
    }
    await ref.current?.requestFullscreen().catch(() => {})
    // Поворот разрешён браузером только в полноэкранном режиме
    if (document.fullscreenElement && isTouchDevice()) await orientation()?.lock?.('landscape').catch(() => {})
=======
  const toggle = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else ref.current?.requestFullscreen().catch(() => {})
>>>>>>> 75d61a1b01b63716100cf7cfc41b468a6aaf49b4
  }, [])

  return { ref, active, supported, toggle }
}
