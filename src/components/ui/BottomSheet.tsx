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
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl safe-bottom"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="sticky top-0 z-10 pt-3 pb-2 flex justify-center" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div
                className="w-10 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--text-muted)', opacity: 0.4 }}
              />
            </div>

            {title && (
              <div className="px-6 pb-3">
                <h2
                  className="text-lg font-semibold tracking-tight"
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
