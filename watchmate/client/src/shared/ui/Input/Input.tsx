import { type InputHTMLAttributes } from 'react'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  onChange?: (value: string) => void
}

function Input({ onChange, className = '', ...rest }: InputProps) {
  return (
    <input
      type="text"
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className={`w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 glass-input focus:outline-none ${className}`}
      {...rest}
    />
  )
}

export { Input }
