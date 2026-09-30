import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// В полном экране браузер показывает только развёрнутый элемент — всё, что в body, не видно
const currentContainer = (): Element => document.fullscreenElement ?? document.body

// Рендер в конец body (или внутрь полноэкранного элемента): всплывающие элементы
// не зависят от контекстов наложения родителей и видны в полноэкранном режиме
export const Portal = ({ children }: { children: ReactNode }) => {
  const [container, setContainer] = useState<Element>(currentContainer)

  useEffect(() => {
    const onChange = () => setContainer(currentContainer())
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  return createPortal(children, container)
}
