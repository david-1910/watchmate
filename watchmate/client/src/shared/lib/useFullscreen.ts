import { useCallback, useEffect, useRef, useState } from 'react'

// Полноэкранный режим для элемента; supported=false там, где его нет (iOS Safari)
export const useFullscreen = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)
  const [active, setActive] = useState(false)
  const supported = typeof document !== 'undefined' && !!document.fullscreenEnabled

  useEffect(() => {
    const onChange = () => setActive(!!ref.current && document.fullscreenElement === ref.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else ref.current?.requestFullscreen().catch(() => {})
  }, [])

  return { ref, active, supported, toggle }
}
