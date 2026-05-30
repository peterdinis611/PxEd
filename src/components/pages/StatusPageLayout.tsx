import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function StatusPageLayout({
  badge,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  className,
}: {
  badge?: React.ReactNode
  title: string
  description?: string
  children?: React.ReactNode
  primaryAction?: { label: string; onClick?: () => void; to?: string }
  secondaryAction?: { label: string; onClick?: () => void; to?: string }
  className?: string
}) {
  return (
    <div
      className={cn(
        'editor-shell relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden px-6 py-12',
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-indigo-500/8 blur-3xl" />
      </motion.div>

      <motion.div
        className="relative z-10 flex w-full max-w-md flex-col items-center text-center"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {badge && (
          <motion.div variants={staggerItem} className="mb-6">
            {badge}
          </motion.div>
        )}

        <motion.h1
          variants={staggerItem}
          className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl"
        >
          {title}
        </motion.h1>

        {description && (
          <motion.p
            variants={staggerItem}
            className="mt-3 max-w-sm text-ui-base leading-relaxed text-zinc-400"
          >
            {description}
          </motion.p>
        )}

        {children && (
          <motion.div variants={staggerItem} className="mt-6 w-full">
            {children}
          </motion.div>
        )}

        {(primaryAction || secondaryAction) && (
          <motion.div
            variants={staggerItem}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            {primaryAction &&
              (primaryAction.to ? (
                <Button asChild>
                  <Link to={primaryAction.to}>{primaryAction.label}</Link>
                </Button>
              ) : (
                <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
              ))}
            {secondaryAction &&
              (secondaryAction.to ? (
                <Button variant="outline" asChild>
                  <Link to={secondaryAction.to}>{secondaryAction.label}</Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              ))}
          </motion.div>
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-6 text-ui-xs text-zinc-600"
      >
        PxEd
      </motion.p>
    </div>
  )
}

export function StatusIconRing({
  children,
  tone = 'accent',
}: {
  children: React.ReactNode
  tone?: 'accent' | 'danger' | 'muted'
}) {
  const ring =
    tone === 'danger'
      ? 'ring-red-500/30 shadow-red-500/20'
      : tone === 'muted'
        ? 'ring-zinc-500/30 shadow-zinc-500/10'
        : 'ring-blue-500/35 shadow-blue-500/25'

  return (
    <motion.div
      className={cn(
        'relative flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-800/80 shadow-xl ring-1 backdrop-blur-sm',
        ring,
      )}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            tone === 'danger'
              ? 'radial-gradient(circle at 50% 50%, rgb(239 68 68 / 0.15), transparent 70%)'
              : 'radial-gradient(circle at 50% 50%, rgb(59 130 246 / 0.2), transparent 70%)',
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  )
}
