import type { ReactNode } from 'react'

type Props = {
  eyebrow: string
  children: ReactNode
  className?: string
}

export const SectionHeading = ({ eyebrow, children, className = '' }: Props) => (
  <div className="text-center mb-16">
    <span className="text-purple-400 font-semibold mb-4 block">{eyebrow}</span>
    <h2 className={`text-4xl md:text-5xl font-bold ${className}`}>{children}</h2>
  </div>
)
