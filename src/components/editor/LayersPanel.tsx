import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Trash2,
  Unlock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToolTooltip } from '@/components/editor/ToolTooltip'
import { useEditor } from '@/context/EditorContext'
import { cn } from '@/lib/utils'
import { springSnappy, staggerContainer, staggerItem } from '@/lib/motion'

function LayerThumb({ canvas }: { canvas: HTMLCanvasElement }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const max = 28
    const scale = Math.min(max / canvas.width, max / canvas.height, 1)
    el.width = Math.max(1, canvas.width * scale)
    el.height = Math.max(1, canvas.height * scale)
    el.getContext('2d')?.drawImage(canvas, 0, 0, el.width, el.height)
  }, [canvas])
  return (
    <canvas
      ref={ref}
      className="h-7 w-7 shrink-0 rounded border border-zinc-700/80 bg-zinc-800"
    />
  )
}

export function LayersPanel() {
  const { state, dispatch, addLayer } = useEditor()
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')
  const dragIdx = useRef<number | null>(null)

  const layers = [...state.layers].reverse()

  const startRename = (id: string, name: string) => {
    setRenaming(id)
    setRenameVal(name)
  }

  const commitRename = () => {
    if (renaming && renameVal.trim()) {
      dispatch({
        type: 'UPDATE_LAYER',
        id: renaming,
        patch: { name: renameVal.trim() },
      })
    }
    setRenaming(null)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="panel-header flex items-center justify-between border-b border-zinc-800 px-2 py-1.5">
        <span>Layers</span>
      </div>

      <div className="smooth-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1.5">
        <motion.div
          className="space-y-0.5 p-1"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <AnimatePresence initial={false}>
            {layers.map((layer) => {
              const realIdx = state.layers.findIndex((l) => l.id === layer.id)
              const isActive = layer.id === state.activeLayerId
              return (
                <motion.div
                  key={layer.id}
                  layout
                  variants={staggerItem}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={springSnappy}
                  draggable
                  onDragStart={() => {
                    dragIdx.current = realIdx
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIdx.current !== null && dragIdx.current !== realIdx) {
                      dispatch({
                        type: 'REORDER_LAYERS',
                        from: dragIdx.current,
                        to: realIdx,
                      })
                    }
                    dragIdx.current = null
                  }}
                  className={cn(
                    'group interactive flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5',
                    isActive
                      ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/40'
                      : 'hover:bg-zinc-800',
                  )}
                  onClick={() =>
                    dispatch({ type: 'SET_ACTIVE_LAYER', id: layer.id })
                  }
                  onDoubleClick={() => startRename(layer.id, layer.name)}
                >
                  <ToolTooltip
                    label={layer.visible ? 'Hide layer' : 'Show layer'}
                    description={
                      layer.visible
                        ? 'Layer will not be drawn on the canvas but stays in the list.'
                        : 'Shows the layer on the canvas again.'
                    }
                    side="left"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-60 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        dispatch({
                          type: 'UPDATE_LAYER',
                          id: layer.id,
                          patch: { visible: !layer.visible },
                        })
                      }}
                    >
                      {layer.visible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-zinc-500" />
                      )}
                    </Button>
                  </ToolTooltip>
                  <ToolTooltip
                    label={layer.locked ? 'Unlock layer' : 'Lock layer'}
                    description={
                      layer.locked
                        ? 'Allows editing and painting on this layer.'
                        : 'Prevents painting and edits on this layer.'
                    }
                    side="left"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-60 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        dispatch({
                          type: 'UPDATE_LAYER',
                          id: layer.id,
                          patch: { locked: !layer.locked },
                        })
                      }}
                    >
                      {layer.locked ? (
                        <Lock className="h-3.5 w-3.5 text-amber-400/80" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5 text-zinc-500" />
                      )}
                    </Button>
                  </ToolTooltip>
                  <LayerThumb canvas={layer.canvas} />
                  {renaming === layer.id ? (
                    <Input
                      className="h-7 flex-1 text-ui-xs"
                      value={renameVal}
                      autoFocus
                      onChange={(e) => setRenameVal(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 truncate text-ui-xs text-zinc-300">
                      {layer.name}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex gap-0.5 border-t border-zinc-800 px-1 py-1">
        {[
          {
            icon: Plus,
            label: 'New layer',
            description: 'Adds an empty layer above the current one.',
            onClick: () => addLayer(),
            disabled: false,
          },
          {
            icon: Copy,
            label: 'Duplicate',
            description: 'Creates a copy of the active layer including its content.',
            onClick: () =>
              state.activeLayerId &&
              dispatch({ type: 'DUPLICATE_LAYER', id: state.activeLayerId }),
            disabled: !state.activeLayerId,
          },
          {
            icon: Trash2,
            label: 'Delete layer',
            description: 'Removes the active layer. The last layer cannot be deleted.',
            onClick: () =>
              state.activeLayerId &&
              dispatch({ type: 'DELETE_LAYER', id: state.activeLayerId }),
            disabled: state.layers.length <= 1,
          },
        ].map(({ icon: Icon, label, description, onClick, disabled }) => (
          <ToolTooltip key={label} label={label} description={description} side="top">
            <Button
              variant="ghost"
              size="icon"
              className="interactive h-7 w-7 rounded"
              disabled={disabled}
              onClick={onClick}
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          </ToolTooltip>
        ))}
      </div>

    </div>
  )
}
