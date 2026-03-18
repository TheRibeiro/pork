import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertTriangle } from 'lucide-react'

interface PillNotificationProps {
  message: string
  type?: 'success' | 'error' | 'warning'
  visible: boolean
  onDismiss?: () => void
}

const iconMap = {
  success: Check,
  error: X,
  warning: AlertTriangle,
}

const colorMap = {
  success: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', icon: '#22c55e' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', icon: '#ef4444' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', icon: '#f59e0b' },
}

export function PillNotification({ message, type = 'success', visible, onDismiss }: PillNotificationProps) {
  const Icon = iconMap[type]
  const colors = colorMap[type]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed top-4 left-1/2 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg cursor-pointer"
          style={{
            transform: 'translateX(-50%)',
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
          onClick={onDismiss}
          layout
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.icon }}
          >
            <Icon size={12} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
