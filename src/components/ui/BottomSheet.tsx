import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 backdrop-blur-sheet"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl safe-bottom"
            style={{ backgroundColor: 'var(--bg-card)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="sticky top-0 z-10 pt-3 pb-2 flex justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: 'var(--text-muted)' }}
              />
            </div>

            {title && (
              <div className="px-6 pb-3">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {title}
                </h2>
              </div>
            )}

            <div className="px-6 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
