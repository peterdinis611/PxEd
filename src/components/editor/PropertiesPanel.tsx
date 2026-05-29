import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { useEditor } from '@/context/EditorContext'
import {
  brightnessContrast,
  hueSaturationLightness,
  levels,
  invertColors,
  grayscale,
  colorBalance,
} from '@/lib/canvas/adjustments'
import { cn } from '@/lib/utils'

type PanelTab = 'edit' | 'view' | 'history'

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'view', label: 'View' },
  { id: 'history', label: 'History' },
]

export function PropertiesPanel() {
  const [tab, setTab] = useState<PanelTab>('edit')
  const { activeLayer, commitHistory, updateActiveLayerCanvas } = useEditor()

  const applyAdj = (fn: (ctx: CanvasRenderingContext2D) => void, label: string) => {
    if (!activeLayer) return
    updateActiveLayerCanvas(fn)
    commitHistory(label)
  }

  return (
    <section className="sidebar-section flex min-h-0 flex-1 flex-col">
      <div
        className="flex shrink-0 items-center gap-0.5 border-b border-zinc-800 px-1 py-0.5"
        role="tablist"
        aria-label="Adjustments panel"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={cn(
              'interactive flex-1 rounded px-2 py-1.5 text-ui-xs font-medium transition-colors',
              tab === id
                ? 'bg-zinc-800 text-zinc-200'
                : 'text-zinc-600 hover:text-zinc-400',
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="smooth-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {tab === 'edit' && <EditPanel onApply={applyAdj} hasLayer={!!activeLayer} />}
        {tab === 'view' && <ViewPanel />}
        {tab === 'history' && <HistoryPanel />}
      </div>
    </section>
  )
}

function EditPanel({
  onApply,
  hasLayer,
}: {
  onApply: (fn: (ctx: CanvasRenderingContext2D) => void, label: string) => void
  hasLayer: boolean
}) {
  if (!hasLayer) {
    return (
      <p className="py-4 text-center text-ui-xs text-zinc-600">Select a layer</p>
    )
  }

  return <AdjustmentSliders onApply={onApply} />
}

function ViewPanel() {
  const { state, dispatch } = useEditor()

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant={state.showGrid ? 'secondary' : 'ghost'} className="h-7 px-2 text-ui-xs" onClick={() => dispatch({ type: 'TOGGLE_GRID' })}>Grid</Button>
        <Button size="sm" variant={state.showRulers ? 'secondary' : 'ghost'} className="h-7 px-2 text-ui-xs" onClick={() => dispatch({ type: 'TOGGLE_RULERS' })}>Rulers</Button>
        <Button size="sm" variant={state.snapToGrid ? 'secondary' : 'ghost'} className="h-7 px-2 text-ui-xs" onClick={() => dispatch({ type: 'SET_VIEW_OPTS', patch: { snapToGrid: !state.snapToGrid } })}>Snap</Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-ui-xs" onClick={() => dispatch({ type: 'REQUEST_FIT_TO_SCREEN' })}>Fit</Button>
      </div>
      <div className="flex items-center gap-2">
        <Label className="w-14 shrink-0 text-ui-xs text-zinc-600">Grid</Label>
        <Slider value={[state.gridSize]} min={5} max={100} step={5} className="flex-1" onValueChange={([v]) => dispatch({ type: 'SET_VIEW_OPTS', patch: { gridSize: v! } })} />
        <span className="w-8 text-right text-ui-xs tabular-nums text-zinc-500">{state.gridSize}</span>
      </div>
    </div>
  )
}

function HistoryPanel() {
  const { state, dispatch } = useEditor()

  if (state.history.length === 0) {
    return (
      <p className="py-4 text-center text-ui-xs text-zinc-600">No history yet</p>
    )
  }

  return (
    <ul className="space-y-1">
      {state.history.map((h, i) => (
        <li key={`${i}-${h.description}`}>
          <motion.button
            type="button"
            layout
            initial={false}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'interactive w-full rounded px-2 py-1.5 text-left text-ui-xs',
              i === state.historyIndex
                ? 'bg-blue-500/15 font-medium text-blue-300 ring-1 ring-blue-500/30'
                : 'text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200',
            )}
            onClick={() => dispatch({ type: 'JUMP_HISTORY', index: i })}
          >
            {h.description}
          </motion.button>
        </li>
      ))}
    </ul>
  )
}

function PanelSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-ui-xs font-semibold uppercase tracking-wide text-zinc-600">{title}</p>
      {children}
    </div>
  )
}

function AdjustmentSliders({
  onApply,
}: {
  onApply: (fn: (ctx: CanvasRenderingContext2D) => void, label: string) => void
}) {
  const [bc, setBc] = useState<[number, number]>([0, 0])
  const [hsl, setHsl] = useState<[number, number, number]>([0, 0, 0])
  const [lv, setLv] = useState<[number, number, number]>([0, 1, 255])
  const [cb, setCb] = useState<[number, number, number]>([0, 0, 0])

  return (
    <div className="space-y-4">
      <PanelSection title="Tone">
        <div className="space-y-2">
          <AdjRow label="Brightness" value={bc[0]} onChange={(v) => setBc([v, bc[1]])} />
          <AdjRow label="Contrast" value={bc[1]} onChange={(v) => setBc([bc[0], v])} />
          <Button size="sm" className="h-7 w-full text-ui-xs" onClick={() => onApply((ctx) => brightnessContrast(ctx, bc[0], bc[1]), 'Brightness/Contrast')}>
            Apply
          </Button>
        </div>
      </PanelSection>

      <PanelSection title="Color">
        <div className="space-y-2">
          <AdjRow
            label="Hue"
            value={hsl[0]}
            min={-180}
            max={180}
            onChange={(v) => setHsl([v, hsl[1], hsl[2]])}
          />
          <AdjRow
            label="Saturation"
            value={hsl[1]}
            onChange={(v) => setHsl([hsl[0], v, hsl[2]])}
          />
          <AdjRow
            label="Lightness"
            value={hsl[2]}
            onChange={(v) => setHsl([hsl[0], hsl[1], v])}
          />
          <Button size="sm" className="h-7 w-full text-ui-xs" onClick={() => onApply((ctx) => hueSaturationLightness(ctx, hsl[0], hsl[1], hsl[2]), 'HSL')}>
            Apply HSL
          </Button>

          <div className="grid grid-cols-3 gap-1">
            <div>
              <Label className="text-ui-xs text-zinc-600">Blk</Label>
              <Input
                type="number"
                className="mt-0.5 h-7 px-1 text-ui-xs"
                value={lv[0]}
                onChange={(e) => setLv([+e.target.value, lv[1], lv[2]])}
              />
            </div>
            <div>
              <Label className="text-ui-xs text-zinc-600">γ</Label>
              <Input
                type="number"
                step={0.1}
                className="mt-0.5 h-7 px-1 text-ui-xs"
                value={lv[1]}
                onChange={(e) => setLv([lv[0], +e.target.value, lv[2]])}
              />
            </div>
            <div>
              <Label className="text-ui-xs text-zinc-600">Wht</Label>
              <Input
                type="number"
                className="mt-0.5 h-7 px-1 text-ui-xs"
                value={lv[2]}
                onChange={(e) => setLv([lv[0], lv[1], +e.target.value])}
              />
            </div>
          </div>
          <Button size="sm" className="h-7 w-full text-ui-xs" onClick={() => onApply((ctx) => levels(ctx, lv[0], lv[1], lv[2]), 'Levels')}>
            Apply levels
          </Button>

          <AdjRow
            label="Cyan / red"
            value={cb[0]}
            min={-100}
            max={100}
            onChange={(v) => setCb([v, cb[1], cb[2]])}
          />
          <AdjRow
            label="Magenta / green"
            value={cb[1]}
            min={-100}
            max={100}
            onChange={(v) => setCb([cb[0], v, cb[2]])}
          />
          <AdjRow
            label="Yellow / blue"
            value={cb[2]}
            min={-100}
            max={100}
            onChange={(v) => setCb([cb[0], cb[1], v])}
          />
          <Button size="sm" className="h-7 w-full text-ui-xs" onClick={() => onApply((ctx) => colorBalance(ctx, cb[0], cb[1], cb[2]), 'Color Balance')}>
            Apply balance
          </Button>
        </div>
      </PanelSection>

      <PanelSection title="Quick">
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 flex-1 text-ui-xs" onClick={() => onApply(invertColors, 'Invert')}>Invert</Button>
          <Button size="sm" variant="ghost" className="h-7 flex-1 text-ui-xs" onClick={() => onApply(grayscale, 'Grayscale')}>Gray</Button>
        </div>
      </PanelSection>
    </div>
  )
}

function AdjRow({
  label,
  value,
  min = -100,
  max = 100,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Label className="text-ui-xs text-zinc-600">{label}</Label>
        <span className="text-ui-xs tabular-nums text-zinc-400">{value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={([v]) => onChange(v!)}
      />
    </div>
  )
}
