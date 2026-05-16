import { type ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary'

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'glass-button',
  secondary: 'glass-button-secondary',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

function Button({ variant = 'primary', children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`px-6 py-3 rounded-xl font-semibold text-white ${VARIANT_STYLES[variant]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export { Button }
