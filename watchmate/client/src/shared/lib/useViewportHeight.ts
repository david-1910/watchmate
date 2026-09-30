import { useEffect } from 'react'

// Высота и смещение видимой области (над экранной клавиатурой) в CSS-переменных --app-height и --app-top.
// Применяется только к модалке/шторке чата, чтобы клавиатура сжимала только сам чат,
// а вся остальная страница и видео оставались стабильными.
export const useViewportHeight = (enabled = true): void => {
  useEffect(() => {
    if (!enabled) return
    const vv = window.visualViewport
    if (!vv) return
    const root = document.documentElement
    const update = () => {
      root.style.setProperty('--app-height', `${vv.height}px`)
      root.style.setProperty('--app-top', `${vv.offsetTop}px`)
      // iOS иногда сдвигает страницу к полю ввода — возвращаем её на место
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      root.style.removeProperty('--app-height')
      root.style.removeProperty('--app-top')
    }
  }, [enabled])
}
