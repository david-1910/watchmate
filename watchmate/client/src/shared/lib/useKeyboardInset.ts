import { useEffect } from 'react'

// Высота экранной клавиатуры в CSS-переменной --keyboard-inset.
// Страницу клавиатура не сжимает (в index.html нет interactive-widget=resizes-content):
// над клавиатурой поднимаются только поля ввода чата — transform на эту величину
export const useKeyboardInset = (): void => {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const root = document.documentElement
    const update = () => {
      // iOS прокручивает страницу к полю ввода — возвращаем её на место, поле поднимем сами
      if (window.scrollY !== 0) window.scrollTo(0, 0)
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      root.style.setProperty('--keyboard-inset', `${Math.round(inset)}px`)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      root.style.removeProperty('--keyboard-inset')
    }
  }, [])
}
