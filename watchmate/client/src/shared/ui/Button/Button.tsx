type ButtonProps = {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
}

function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  const styles = {
    primary: 'glass-button',
    secondary: 'glass-button-secondary',
  }

  return (
    <button
      className={`px-6 py-3 rounded-xl font-semibold text-white ${styles[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export { Button }
