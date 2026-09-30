import type { ReactNode } from 'react'
import { Portal } from '../Portal'

type ModalProps = {
  children: ReactNode
  onClose?: () => void
  backdropClassName?: string
}

function Modal({
  children,
  onClose,
  backdropClassName = 'bg-black/60 backdrop-blur-sm',
}: ModalProps) {
  return (
    <Portal>
      <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
        <div
          className={`absolute inset-0 ${backdropClassName}`}
          onClick={onClose}
        />
        {children}
      </div>
    </Portal>
  )
}

export { Modal }
