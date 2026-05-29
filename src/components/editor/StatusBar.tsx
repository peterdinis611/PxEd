import { motion, AnimatePresence } from 'framer-motion'
import { useEditor } from '@/context/EditorContext'
import { AnimatedNumber } from '@/components/ui/animated-number'

function StatusItem({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </span>
      <span className="tabular-nums text-zinc-400">{children}</span>
    </div>
  )
}

export function StatusBar({
  cursor,
  spacePan,
}: {
  cursor: { x: number; y: number; rgba: string }
  spacePan?: boolean
}) {
  const { state, activeLayer } = useEditor()

  return (
    <footer className="chrome-bar flex h-full w-full items-center gap-3 px-3 text-ui-xs">
      <StatusItem label="Zoom">
        <AnimatedNumber value={state.zoom} format={(n) => `${Math.round(n)}%`} />
      </StatusItem>
      <span className="h-3 w-px bg-zinc-700" />
      <StatusItem label="Canvas">
        {state.canvasWidth} × {state.canvasHeight}
      </StatusItem>
      <span className="h-3 w-px bg-zinc-700" />
      <StatusItem label="XY">
        <AnimatedNumber value={cursor.x} format={(n) => String(Math.round(n))} />
        ,{' '}
        <AnimatedNumber value={cursor.y} format={(n) => String(Math.round(n))} />
      </StatusItem>
      <span className="hidden h-3 w-px bg-zinc-700 sm:block" />
      <span className="hidden h-3 w-px bg-zinc-700 sm:block" />
      <StatusItem label="Color">
        <span className="max-w-[180px] truncate">{cursor.rgba}</span>
      </StatusItem>

      <AnimatePresence>
        {spacePan && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9, x: 8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-ui-sm font-medium text-blue-400"
          >
            Pan mode
          </motion.span>
        )}
      </AnimatePresence>

      <motion.span
        key={activeLayer?.id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="ml-auto truncate text-zinc-500"
      >
        {activeLayer?.name ?? '—'}
      </motion.span>
    </footer>
  )
}
