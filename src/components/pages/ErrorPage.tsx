import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { StatusIconRing, StatusPageLayout } from '@/components/pages/StatusPageLayout'

export function ErrorPage({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. You can try again or return to the editor.',
  error,
  onRetry,
}: {
  title?: string
  description?: string
  error?: Error | null
  onRetry?: () => void
}) {
  return (
    <StatusPageLayout
      badge={
        <motion.div
          animate={{ x: [0, -2, 2, -1, 1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5 }}
        >
          <StatusIconRing tone="danger">
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.2 }}
            >
              <AlertTriangle className="h-10 w-10 text-red-400" strokeWidth={1.75} />
            </motion.div>
          </StatusIconRing>
        </motion.div>
      }
      title={title}
      description={description}
      primaryAction={
        onRetry
          ? { label: 'Try again', onClick: onRetry }
          : { label: 'Back to editor', to: '/' }
      }
      secondaryAction={{ label: 'Reload page', onClick: () => window.location.reload() }}
    >
      {error?.message && (
        <motion.details
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="mx-auto max-w-sm rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-left"
        >
          <summary className="cursor-pointer text-ui-xs font-medium text-red-300/90">
            Error details
          </summary>
          <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-zinc-500">
            {error.message}
          </pre>
        </motion.details>
      )}
    </StatusPageLayout>
  )
}
