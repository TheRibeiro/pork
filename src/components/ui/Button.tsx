import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants = {
  primary: 'bg-[var(--color-primary)] text-white hover:opacity-90',
  secondary: 'text-[var(--text-primary)] hover:opacity-80',
  ghost: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${variant === 'secondary' ? 'bg-[var(--bg-input)]' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
