type InputProps = {
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

function Input({ placeholder, value, onChange }: InputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700  focus:border-purple-500 focus:outline-none"
    />
  )
}

export { Input }
