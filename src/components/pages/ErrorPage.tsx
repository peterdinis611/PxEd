import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { ErrorDetailsPanel } from '@/components/pages/ErrorDetailsPanel'
import { StatusIconRing, StatusPageLayout } from '@/components/pages/StatusPageLayout'
import { buildErrorContext, type ErrorContext } from '@/lib/errorReport'

export function ErrorPage({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. You can try again or return to the editor.',
  error,
  componentStack,
  context,
  onRetry,
}: {
  title?: string
  description?: string
  error?: Error | null
  componentStack?: string | null
  context?: ErrorContext
  onRetry?: () => void
}) {
  const location = useLocation()
  const resolvedContext =
    context ?? buildErrorContext(location.pathname + location.search)

  return (
    <StatusPageLayout
      className="py-10"
      contentClassName="max-w-2xl"
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
      {error ? (
        <ErrorDetailsPanel
          report={{ error, componentStack, context: resolvedContext }}
          context={resolvedContext}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left"
        >
          <p className="text-ui-xs leading-relaxed text-zinc-500">
            No error object was attached. If this keeps happening, reload the page or
            check your network connection.
          </p>
          <dl className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
            {resolvedContext.route && (
              <>
                <dt className="text-[10px] uppercase tracking-wide text-zinc-600">
                  Route
                </dt>
                <dd className="font-mono text-[11px] text-zinc-400">
                  {resolvedContext.route}
                </dd>
              </>
            )}
            {resolvedContext.timestamp && (
              <>
                <dt className="text-[10px] uppercase tracking-wide text-zinc-600">
                  Time
                </dt>
                <dd className="font-mono text-[11px] text-zinc-400">
                  {resolvedContext.timestamp}
                </dd>
              </>
            )}
          </dl>
        </motion.div>
      )}
    </StatusPageLayout>
  )
}
