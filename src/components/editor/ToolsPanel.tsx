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
import { Separator } from '@/components/ui/separator'
import { ColorsDock } from '@/components/editor/ColorsDock'
import { ToolTooltip } from '@/components/editor/ToolTooltip'
import { useEditor } from '@/context/EditorContext'
import { cn } from '@/lib/utils'
import { springSnappy } from '@/lib/motion'
import type { ToolName } from '@/types/editor'

const ICON = 'h-[15px] w-[15px]'

const TOOLS: {
  id: ToolName
  icon: React.ReactNode
  label: string
  description: string
  key: string
}[] = [
  {
    id: 'move',
    icon: <MousePointer2 className={ICON} />,
    label: 'Move',
    description: 'Moves the active layer on the canvas.',
    key: 'V',
  },
  {
    id: 'marquee-rect',
    icon: <Square className={ICON} />,
    label: 'Rectangular Marquee',
    description: 'Creates a rectangular selection.',
    key: 'M',
  },
  {
    id: 'marquee-ellipse',
    icon: <Circle className={ICON} />,
    label: 'Elliptical Marquee',
    description: 'Creates an elliptical selection.',
    key: '',
  },
  {
    id: 'lasso',
    icon: <Lasso className={ICON} />,
    label: 'Lasso',
    description: 'Freehand selection by dragging on the canvas.',
    key: 'L',
  },
  {
    id: 'magic-wand',
    icon: <Wand2 className={ICON} />,
    label: 'Magic Wand',
    description: 'Selects similar pixels by color and tolerance.',
    key: 'W',
  },
  {
    id: 'crop',
    icon: <Crop className={ICON} />,
    label: 'Crop',
    description: 'Crops the document to the chosen area.',
    key: 'C',
  },
  {
    id: 'brush',
    icon: <Brush className={ICON} />,
    label: 'Brush',
    description: 'Paints soft strokes with adjustable size and hardness.',
    key: 'B',
  },
  {
    id: 'pencil',
    icon: <Pencil className={ICON} />,
    label: 'Pencil',
    description: 'Draws hard pixels without anti-aliasing.',
    key: 'P',
  },
  {
    id: 'eraser',
    icon: <Eraser className={ICON} />,
    label: 'Eraser',
    description: 'Erases pixels on the active layer.',
    key: 'E',
  },
  {
    id: 'fill',
    icon: <PaintBucket className={ICON} />,
    label: 'Paint Bucket',
    description: 'Fills a contiguous area with the foreground color.',
    key: 'G',
  },
  {
    id: 'gradient',
    icon: <Blend className={ICON} />,
    label: 'Gradient',
    description: 'Draws a gradient from foreground to background color.',
    key: '⇧G',
  },
  {
    id: 'eyedropper',
    icon: <Eye className={ICON} />,
    label: 'Eyedropper',
    description: 'Picks the color from the pixel under the cursor.',
    key: 'I',
  },
  {
    id: 'text',
    icon: <Type className={ICON} />,
    label: 'Text',
    description: 'Adds text to a layer. Click the canvas and type.',
    key: 'T',
  },
  {
    id: 'shape-rect',
    icon: <Square className={ICON} />,
    label: 'Rectangle',
    description: 'Draws a rectangle or square.',
    key: 'U',
  },
  {
    id: 'shape-ellipse',
    icon: <Circle className={ICON} />,
    label: 'Ellipse',
    description: 'Draws an ellipse or circle.',
    key: '',
  },
  {
    id: 'shape-line',
    icon: <Minus className={ICON} />,
    label: 'Line',
    description: 'Draws a straight line.',
    key: '',
  },
  {
    id: 'zoom',
    icon: <ZoomIn className={ICON} />,
    label: 'Zoom',
    description: 'Zooms the preview in or out. Ctrl + scroll wheel also zooms.',
    key: 'Z',
  },
]

export function ToolsPanel() {
  const { state, dispatch } = useEditor()

  return (
    <aside className="relative flex h-full w-full flex-col items-center border-r border-zinc-800 bg-[var(--color-editor-surface)] py-1">
      <div className="relative flex w-full flex-col items-center gap-0.5">
        {TOOLS.map((t) => {
          const active = state.tool === t.id
          return (
            <ToolTooltip
              key={t.id}
              label={t.label}
              description={t.description}
              shortcut={t.key || undefined}
            >
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
            </ToolTooltip>
          )
        })}
      </div>

      <Separator className="my-2 w-6 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.25 }}
      >
        <ColorsDock />
      </motion.div>

      <ToolTooltip
        label="Pan canvas"
        description="Hold Space and drag to pan the canvas without changing the active tool."
        shortcut="Space"
        side="right"
      >
        <motion.div
          className="mt-auto cursor-default pb-1 text-zinc-600"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Hand className="mx-auto h-4 w-4" />
        </motion.div>
      </ToolTooltip>
    </aside>
  )
}
