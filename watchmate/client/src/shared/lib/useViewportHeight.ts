import { useEffect } from 'react'

// Высота видимой области (над экранной клавиатурой) в CSS-переменной --app-height.
// Android сам сжимает страницу (interactive-widget=resizes-content в index.html),
// iOS Safari — нет: там клавиатура сдвигает страницу, и её приходилось прокручивать обратно
export const useViewportHeight = (): void => {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const root = document.documentElement
    const update = () => {
      root.style.setProperty('--app-height', `${vv.height}px`)
      // iOS прокручивает страницу к полю ввода — возвращаем её на место, поле уже над клавиатурой
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      root.style.removeProperty('--app-height')
    }
  }, [])
}
