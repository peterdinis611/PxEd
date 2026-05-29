import { motion } from 'framer-motion'
import {
  Brush,
  Circle,
  Crop,
  Eraser,
  Eye,
  Hand,
  Lasso,
  Minus,
  MousePointer2,
  PaintBucket,
  Pencil,
  Square,
  Type,
  Wand2,
  ZoomIn,
  Blend,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { ColorPicker } from '@/components/editor/ColorPicker'
import { useEditor } from '@/context/EditorContext'
import { cn } from '@/lib/utils'
import { springSnappy } from '@/lib/motion'
import type { ToolName } from '@/types/editor'

const ICON = 'h-[15px] w-[15px]'

const TOOLS: { id: ToolName; icon: React.ReactNode; label: string; key: string }[] =
  [
    { id: 'move', icon: <MousePointer2 className={ICON} />, label: 'Move', key: 'V' },
    { id: 'marquee-rect', icon: <Square className={ICON} />, label: 'Rect Marquee', key: 'M' },
    { id: 'marquee-ellipse', icon: <Circle className={ICON} />, label: 'Ellipse Marquee', key: '' },
    { id: 'lasso', icon: <Lasso className={ICON} />, label: 'Lasso', key: 'L' },
    { id: 'magic-wand', icon: <Wand2 className={ICON} />, label: 'Magic Wand', key: 'W' },
    { id: 'crop', icon: <Crop className={ICON} />, label: 'Crop', key: 'C' },
    { id: 'brush', icon: <Brush className={ICON} />, label: 'Brush', key: 'B' },
    { id: 'pencil', icon: <Pencil className={ICON} />, label: 'Pencil', key: 'P' },
    { id: 'eraser', icon: <Eraser className={ICON} />, label: 'Eraser', key: 'E' },
    { id: 'fill', icon: <PaintBucket className={ICON} />, label: 'Fill', key: 'G' },
    { id: 'gradient', icon: <Blend className={ICON} />, label: 'Gradient', key: '⇧G' },
    { id: 'eyedropper', icon: <Eye className={ICON} />, label: 'Eyedropper', key: 'I' },
    { id: 'text', icon: <Type className={ICON} />, label: 'Text', key: 'T' },
    { id: 'shape-rect', icon: <Square className={ICON} />, label: 'Rectangle', key: 'U' },
    { id: 'shape-ellipse', icon: <Circle className={ICON} />, label: 'Ellipse', key: '' },
    { id: 'shape-line', icon: <Minus className={ICON} />, label: 'Line', key: '' },
    { id: 'zoom', icon: <ZoomIn className={ICON} />, label: 'Zoom', key: 'Z' },
  ]

export function ToolsPanel() {
  const { state, dispatch } = useEditor()

  const setColor = (which: 'fg' | 'bg', color: string) => {
    dispatch({
      type: 'SET_COLORS',
      ...(which === 'fg' ? { fg: color } : { bg: color }),
    })
    dispatch({ type: 'ADD_RECENT_COLOR', color })
  }

  return (
    <aside className="relative flex h-full w-full flex-col items-center border-r border-zinc-800 bg-[var(--color-editor-surface)] py-1">
      <div className="relative flex w-full flex-col items-center gap-0.5">
        {TOOLS.map((t) => {
          const active = state.tool === t.id
          return (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'interactive relative z-[1] flex h-8 w-8 items-center justify-center rounded',
                    active
                      ? 'text-blue-400'
                      : 'text-zinc-400 hover:text-zinc-200',
                  )}
                  onClick={() => dispatch({ type: 'SET_TOOL', tool: t.id })}
                >
                  {active && (
                    <motion.span
                      layoutId="active-tool-bg"
                      className="absolute inset-0 rounded bg-blue-500/15 ring-1 ring-inset ring-blue-500/35"
                      transition={springSnappy}
                    />
                  )}
                  <span className="relative">{t.icon}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-ui-sm font-medium">
                {t.label}
                {t.key ? (
                  <kbd className="ml-2 rounded bg-zinc-700/80 px-1.5 py-0.5 text-ui-xs text-zinc-400">
                    {t.key}
                  </kbd>
                ) : null}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      <Separator className="my-2 w-6 opacity-40" />

      <motion.div
        className="flex flex-col items-center gap-1 px-1.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.25 }}
      >
        <ColorPicker
          color={state.foregroundColor}
          onChange={(c) => setColor('fg', c)}
          recentColors={state.recentColors}
        >
          <button
            type="button"
            className="color-swatch h-5 w-8 rounded border border-zinc-700"
            style={{ backgroundColor: state.foregroundColor }}
            title="Foreground"
          />
        </ColorPicker>
        <ColorPicker
          color={state.backgroundColor}
          onChange={(c) => setColor('bg', c)}
          recentColors={state.recentColors}
        >
          <button
            type="button"
            className="color-swatch h-5 w-8 rounded border border-zinc-700"
            style={{ backgroundColor: state.backgroundColor }}
            title="Background"
          />
        </ColorPicker>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded text-ui-xs text-zinc-500"
          onClick={() => dispatch({ type: 'SWAP_COLORS' })}
          title="Swap (X)"
        >
          ⇄
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded text-ui-xs text-zinc-500"
          onClick={() => dispatch({ type: 'RESET_COLORS' })}
          title="Reset (D)"
        >
          D
        </Button>
      </motion.div>

      <motion.div
        className="mt-auto pb-1 text-zinc-600"
        title="Space+drag to pan"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Hand className="mx-auto h-4 w-4" />
      </motion.div>
    </aside>
  )
}
