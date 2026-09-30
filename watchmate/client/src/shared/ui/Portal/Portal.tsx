import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Рендер в конец body: всплывающие элементы не зависят от контекстов наложения родителей
export const Portal = ({ children }: { children: ReactNode }) => createPortal(children, document.body)
