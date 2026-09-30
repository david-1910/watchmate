import { useCallback, useEffect, useRef, useState } from 'react'

// lock/unlock есть не во всех браузерах (нет в iOS Safari) и не во всех версиях lib.dom
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape') => Promise<void>
  unlock?: () => void
}

const getOrientation = (): LockableOrientation | undefined =>
  typeof screen !== 'undefined' ? (screen.orientation as LockableOrientation | undefined) : undefined

// Сенсорный экран — телефон или планшет: там в полном экране поворачиваем в альбомную ориентацию
const isTouchDevice = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

// Полноэкранный режим: нативный API с надёжным CSS-fallback для iOS Safari и встроенных WebView
export const useFullscreen = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)
  const [active, setActive] = useState(false)
  const [isFallback, setIsFallback] = useState(false)

  // Полноэкранный режим доступен всегда (нативно либо через fallback)
  const supported = true

  useEffect(() => {
    const onChange = () => {
      const doc = document as unknown as {
        fullscreenElement?: Element
        webkitFullscreenElement?: Element
      }
      const isNativeActive = !!ref.current && (doc.fullscreenElement === ref.current || doc.webkitFullscreenElement === ref.current)
      if (isNativeActive) {
        setActive(true)
      } else if (!isFallback) {
        setActive(false)
        getOrientation()?.unlock?.()
      }
    }

    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [isFallback])

  // Выход по Escape при fallback-режиме
  useEffect(() => {
    if (!isFallback) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFallback(false)
        setActive(false)
        getOrientation()?.unlock?.()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isFallback])

  const toggle = useCallback(async () => {
    if (active) {
      const doc = document as unknown as {
        fullscreenElement?: Element
        webkitFullscreenElement?: Element
        exitFullscreen?: () => Promise<void>
        webkitExitFullscreen?: () => Promise<void>
      }

      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen().catch(() => {})
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen().catch(() => {})
        }
      }
      setIsFallback(false)
      setActive(false)
      getOrientation()?.unlock?.()
      return
    }

    const el = ref.current
    if (el) {
      const target = el as unknown as {
        requestFullscreen?: () => Promise<void>
        webkitRequestFullscreen?: () => Promise<void>
      }
      const req = target.requestFullscreen || target.webkitRequestFullscreen
      if (typeof req === 'function') {
        try {
          await req.call(el)
          if (isTouchDevice()) {
            await getOrientation()?.lock?.('landscape').catch(() => {})
          }
          return
        } catch {
          // Если нативный fullscreen отклонён или не поддерживается, переходим к CSS fallback
        }
      }
    }

    // CSS fallback (iOS Safari, мобильные WebView и т.д.)
    setIsFallback(true)
    setActive(true)
    if (isTouchDevice()) {
      await getOrientation()?.lock?.('landscape').catch(() => {})
    }
  }, [active])

  return { ref, active, supported, toggle }
}

