import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { HTMLMotionProps } from 'framer-motion'

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants = {
  primary: 'bg-[var(--color-primary)] text-white hover:opacity-90',
  secondary: 'text-[var(--text-primary)] hover:opacity-80 border border-[var(--border-color)]',
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
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${variant === 'secondary' ? 'bg-[var(--bg-input)]' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  )
}
