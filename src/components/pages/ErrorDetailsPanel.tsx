import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  formatErrorReport,
  type ErrorContext,
  type ErrorReport,
} from '@/lib/errorReport'
import { cn } from '@/lib/utils'

function DetailSection({
  title,
  defaultOpen = false,
  children,
  badge,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: string
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-zinc-800/80 bg-zinc-900/50 text-left"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-ui-xs font-medium text-zinc-300 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform group-open:rotate-180" />
        <span className="flex-1">{title}</span>
        {badge && (
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
            {badge}
          </span>
        )}
      </summary>
      <div className="border-t border-zinc-800/80 px-3 py-2">{children}</div>
    </details>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2 text-[11px] leading-snug">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="break-all font-mono text-zinc-300">{value}</dd>
    </div>
  )
}

function CodeBlock({ text, maxHeight = 'max-h-40' }: { text: string; maxHeight?: string }) {
  return (
    <pre
      className={cn(
        'overflow-auto whitespace-pre-wrap break-words rounded-md bg-zinc-950/80 p-2.5 font-mono text-[10px] leading-relaxed text-zinc-400 ring-1 ring-inset ring-zinc-800',
        maxHeight,
      )}
    >
      {text}
    </pre>
  )
}

export function ErrorDetailsPanel({
  report,
  context,
}: {
  report: ErrorReport
  context?: ErrorContext
}) {
  const [copied, setCopied] = useState(false)
  const mergedContext = context ?? report.context
  const { error, componentStack } = report

  const fullReport = useMemo(
    () => formatErrorReport({ error, componentStack, context: mergedContext }),
    [error, componentStack, mergedContext],
  )

  const stackLines = error.stack?.split('\n').length ?? 0
  const componentLines = componentStack?.trim().split('\n').length ?? 0

  const copyReport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullReport)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = fullReport
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }, [fullReport])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className="mx-auto w-full max-w-2xl space-y-3 text-left"
    >
      <div className="rounded-xl border border-red-500/25 bg-gradient-to-b from-red-500/10 to-zinc-900/40 p-4 ring-1 ring-inset ring-red-500/10">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-red-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-red-300">
            {error.name}
          </span>
          {mergedContext?.buildMode === 'development' && (
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300/90">
              Development
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-snug text-zinc-100">{error.message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-zinc-700 bg-zinc-900/80 text-ui-xs"
            onClick={() => void copyReport()}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy full report
              </>
            )}
          </Button>
        </div>
      </div>

      {mergedContext && (
        <DetailSection title="Environment" defaultOpen>
          <dl className="space-y-2">
            {mergedContext.timestamp && (
              <MetaRow label="Time" value={mergedContext.timestamp} />
            )}
            {mergedContext.route && (
              <MetaRow label="Route" value={mergedContext.route} />
            )}
            {mergedContext.url && <MetaRow label="URL" value={mergedContext.url} />}
            {mergedContext.viewport && (
              <MetaRow label="Viewport" value={mergedContext.viewport} />
            )}
            {mergedContext.buildMode && (
              <MetaRow label="Mode" value={mergedContext.buildMode} />
            )}
            {mergedContext.userAgent && (
              <MetaRow label="Browser" value={mergedContext.userAgent} />
            )}
          </dl>
        </DetailSection>
      )}

      {error.stack && (
        <DetailSection title="Stack trace" badge={`${stackLines} lines`} defaultOpen>
          <CodeBlock text={error.stack} maxHeight="max-h-52" />
        </DetailSection>
      )}

      {componentStack?.trim() && (
        <DetailSection title="Component stack" badge={`${componentLines} lines`}>
          <CodeBlock text={componentStack.trim()} maxHeight="max-h-44" />
        </DetailSection>
      )}

      <DetailSection title="Full report (plain text)">
        <CodeBlock text={fullReport} maxHeight="max-h-36" />
      </DetailSection>
    </motion.div>
  )
}
