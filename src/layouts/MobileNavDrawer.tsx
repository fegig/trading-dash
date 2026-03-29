import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { NavSidebarContent } from './nav-sidebar-content'

type Props = {
  open: boolean
  onClose: () => void
}

/** Slide-in panel from the right; portaled to `document.body`. */
export function MobileNavDrawer({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [open])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-nav-layer"
          className="fixed inset-0 z-100 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            role="presentation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute right-0 top-0 bottom-0 flex flex-col w-[min(100vw,20rem)] sm:w-88 max-w-full bg-neutral-900 border-l border-neutral-800 shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between shrink-0 p-4 border-b border-neutral-800 bg-neutral-950/90 pt-[max(1rem,env(safe-area-inset-top))]">
              <h2 className="font-medium text-neutral-100">Menu</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400"
                aria-label="Close"
              >
                <i className="fi fi-rr-cross" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto scrollBar p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <NavSidebarContent onNavigate={onClose} />
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
