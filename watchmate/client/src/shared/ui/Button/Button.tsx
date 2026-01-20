type ButtonProps = {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
}

function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  const styles = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600',
  }

  return (
    <button
      className={`px-6 py-3 rounded-lg font-semibold ${styles[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export { Button }
