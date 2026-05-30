import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useEditor } from '@/context/EditorContext'
import { snapCoord } from '@/lib/canvas/snap'
import type { BlendMode } from '@/types/editor'

const BLEND_MODES: BlendMode[] = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
]

export function LayerProperties() {
  const { state, dispatch } = useEditor()
  const active = state.layers.find((l) => l.id === state.activeLayerId)

  const snap = (n: number) => snapCoord(n, state.gridSize, state.snapToGrid)

  if (!active) return null

  return (
    <section className="sidebar-section shrink-0 px-2 py-2">
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-x-2 gap-y-2">
        <div>
          <Label className="text-ui-xs text-zinc-600">X</Label>
          <Input
            type="number"
            className="mt-0.5 h-7 px-1.5 text-ui-xs tabular-nums"
            value={Math.round(active.x)}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_LAYER',
                  id: active.id,
                  patch: { x: snap(+e.target.value) },
                })
              }
          />
        </div>
        <div>
          <Label className="text-ui-xs text-zinc-600">Y</Label>
          <Input
            type="number"
            className="mt-0.5 h-7 px-1.5 text-ui-xs tabular-nums"
            value={Math.round(active.y)}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_LAYER',
                  id: active.id,
                  patch: { y: snap(+e.target.value) },
                })
              }
          />
        </div>
        <p className="pb-1 text-right text-ui-xs tabular-nums text-zinc-500">
          {active.canvas.width}×{active.canvas.height}
        </p>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Label className="w-12 shrink-0 text-ui-xs text-zinc-600">Opacity</Label>
        <Slider
          value={[active.opacity]}
          min={0}
          max={100}
          step={1}
          className="flex-1"
          onValueChange={([v]) =>
            dispatch({
              type: 'UPDATE_LAYER',
              id: active.id,
              patch: { opacity: v! },
            })
          }
        />
        <span className="w-8 text-right text-ui-xs tabular-nums text-zinc-400">
          {active.opacity}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Label className="w-12 shrink-0 text-ui-xs text-zinc-600">Blend</Label>
        <Select
          value={active.blendMode}
          onValueChange={(v) =>
            dispatch({
              type: 'UPDATE_LAYER',
              id: active.id,
              patch: { blendMode: v as BlendMode },
            })
          }
        >
          <SelectTrigger className="h-7 flex-1 text-ui-xs capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BLEND_MODES.map((m) => (
              <SelectItem key={m} value={m} className="text-ui-xs capitalize">
                {m.replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}
