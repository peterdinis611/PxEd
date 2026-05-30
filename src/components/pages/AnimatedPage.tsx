import { motion } from 'framer-motion'

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="min-h-dvh w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
