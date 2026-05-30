import { motion } from 'framer-motion'
import { ImageOff } from 'lucide-react'
import { StatusIconRing, StatusPageLayout } from '@/components/pages/StatusPageLayout'

function Glitch404() {
  return (
    <div className="relative select-none font-mono text-5xl font-bold tracking-tighter sm:text-6xl">
      <motion.span
        className="absolute inset-0 text-red-500/40"
        aria-hidden
        animate={{ x: [-2, 2, -1, 0], opacity: [0, 0.7, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
      >
        404
      </motion.span>
      <motion.span
        className="absolute inset-0 text-blue-400/40"
        aria-hidden
        animate={{ x: [2, -2, 1, 0], opacity: [0, 0.7, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1, delay: 0.05 }}
      >
        404
      </motion.span>
      <motion.span
        className="relative bg-gradient-to-br from-zinc-100 to-zinc-400 bg-clip-text text-transparent"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        404
      </motion.span>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <StatusPageLayout
      badge={
        <StatusIconRing tone="muted">
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ImageOff className="h-10 w-10 text-zinc-400" strokeWidth={1.5} />
          </motion.div>
        </StatusIconRing>
      }
      title="Page not found"
      description="This canvas doesn't exist. The URL may be wrong or the page was moved."
      primaryAction={{ label: 'Open editor', to: '/' }}
      secondaryAction={{ label: 'Go back', onClick: () => window.history.back() }}
    >
      <Glitch404 />
    </StatusPageLayout>
  )
}
