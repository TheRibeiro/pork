import { motion } from 'framer-motion'
import { useRef } from 'react'
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

export function Card({ children, className = '', highlight = false }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty('--mouse-x', `${x}px`)
    cardRef.current.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      whileTap={{ scale: 0.98 }}
      className={`rounded-2xl p-4 card-spotlight ${highlight ? 'animated-border' : ''} ${className}`}
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
