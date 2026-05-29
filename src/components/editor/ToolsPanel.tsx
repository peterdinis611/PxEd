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
    label: 'Presun',
    description: 'Presúva aktívnu vrstvu po plátne.',
    key: 'V',
  },
  {
    id: 'marquee-rect',
    icon: <Square className={ICON} />,
    label: 'Obdĺžnikový výber',
    description: 'Vytvorí obdĺžnikovú výberovú oblasť.',
    key: 'M',
  },
  {
    id: 'marquee-ellipse',
    icon: <Circle className={ICON} />,
    label: 'Eliptický výber',
    description: 'Vytvorí eliptickú výberovú oblasť.',
    key: '',
  },
  {
    id: 'lasso',
    icon: <Lasso className={ICON} />,
    label: 'Lasso',
    description: 'Voľný výber ťahaním po plátne.',
    key: 'L',
  },
  {
    id: 'magic-wand',
    icon: <Wand2 className={ICON} />,
    label: 'Kúzelná palička',
    description: 'Vyberie podobné pixely podľa farby a tolerancie.',
    key: 'W',
  },
  {
    id: 'crop',
    icon: <Crop className={ICON} />,
    label: 'Orez',
    description: 'Orezá dokument na zvolenú oblasť.',
    key: 'C',
  },
  {
    id: 'brush',
    icon: <Brush className={ICON} />,
    label: 'Štetec',
    description: 'Maľuje mäkkými ťahmi s nastaviteľnou veľkosťou a tvrdosťou.',
    key: 'B',
  },
  {
    id: 'pencil',
    icon: <Pencil className={ICON} />,
    label: 'Ceruzka',
    description: 'Kreslí ostré pixely bez rozmazania.',
    key: 'P',
  },
  {
    id: 'eraser',
    icon: <Eraser className={ICON} />,
    label: 'Guma',
    description: 'Maže pixely na aktívnej vrstve.',
    key: 'E',
  },
  {
    id: 'fill',
    icon: <PaintBucket className={ICON} />,
    label: 'Vyplnenie',
    description: 'Vyplní súvislú oblasť vybranou farbou.',
    key: 'G',
  },
  {
    id: 'gradient',
    icon: <Blend className={ICON} />,
    label: 'Prechod',
    description: 'Nakreslí prechod z poprednej do pozadím farby.',
    key: '⇧G',
  },
  {
    id: 'eyedropper',
    icon: <Eye className={ICON} />,
    label: 'Pipeta',
    description: 'Zoberie farbu z pixelu pod kurzorom.',
    key: 'I',
  },
  {
    id: 'text',
    icon: <Type className={ICON} />,
    label: 'Text',
    description: 'Pridá text na vrstvu. Klikni na plátno a píš.',
    key: 'T',
  },
  {
    id: 'shape-rect',
    icon: <Square className={ICON} />,
    label: 'Obdĺžnik',
    description: 'Nakreslí obdĺžnik alebo štvorec.',
    key: 'U',
  },
  {
    id: 'shape-ellipse',
    icon: <Circle className={ICON} />,
    label: 'Elipsa',
    description: 'Nakreslí elipsu alebo kruh.',
    key: '',
  },
  {
    id: 'shape-line',
    icon: <Minus className={ICON} />,
    label: 'Čiara',
    description: 'Nakreslí priamu čiaru.',
    key: '',
  },
  {
    id: 'zoom',
    icon: <ZoomIn className={ICON} />,
    label: 'Lupa',
    description: 'Priblíži alebo oddialí náhľad. Ctrl + koliesko tiež zoomuje.',
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
        label="Posun náhľadu"
        description="Drž Medzerník a ťahaj myšou pre posun plátna bez zmeny nástroja."
        shortcut="Medzerník"
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
