import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  highlight?: boolean
}

const springTransition = {
  type: 'spring' as const,
  mass: 1,
  stiffness: 400,
  damping: 30,
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      whileTap={{ scale: 0.98 }}
      className={`rounded-2xl p-4 ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 24px var(--shadow-color)',
      }}
    >
      {children}
    </motion.div>
  )
}
