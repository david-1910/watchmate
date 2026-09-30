import { useEffect, type RefObject } from 'react'

// Закрывает всплывающий элемент по клику вне всех переданных элементов и по Escape
export const useDismiss = (refs: RefObject<HTMLElement | null>[], onClose: () => void, enabled: boolean): void => {
  useEffect(() => {
    if (!enabled) return
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (!refs.some((r) => r.current?.contains(target))) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [refs, onClose, enabled])
}
