type InputProps = {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
}

function Input({ placeholder, value, onChange, onKeyDown }: InputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 glass-input focus:outline-none"
    />
  )
}

export { Input }
