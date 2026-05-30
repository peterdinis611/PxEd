import { ArrowDownUp } from 'lucide-react'
import { ColorPicker } from '@/components/editor/ColorPicker'
import { ToolTooltip } from '@/components/editor/ToolTooltip'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/context/EditorContext'
import { cn } from '@/lib/utils'

/** Photoshop-style FG/BG color dock */
export function ColorsDock() {
  const { state, dispatch } = useEditor()

  const setColor = (which: 'fg' | 'bg', color: string) => {
    dispatch({
      type: 'SET_COLORS',
      ...(which === 'fg' ? { fg: color } : { bg: color }),
    })
    dispatch({ type: 'ADD_RECENT_COLOR', color })
  }

  return (
    <div className="flex flex-col items-center gap-2 px-1.5 py-1">
      <div className="relative h-[52px] w-[52px]">
        <ColorPicker
          color={state.backgroundColor}
          onChange={(c) => setColor('bg', c)}
          recentColors={state.recentColors}
          label="Background (BG)"
        >
          <button
            type="button"
            className={cn(
              'color-swatch absolute bottom-0 right-0 z-0 h-9 w-9 rounded-md border-2 border-zinc-900 shadow-md',
              'ring-1 ring-zinc-600',
            )}
            style={{ backgroundColor: state.backgroundColor }}
            aria-label="Background"
          />
        </ColorPicker>

        <ColorPicker
          color={state.foregroundColor}
          onChange={(c) => setColor('fg', c)}
          recentColors={state.recentColors}
          label="Foreground (FG)"
        >
          <button
            type="button"
            className={cn(
              'color-swatch absolute left-0 top-0 z-10 h-10 w-10 rounded-md border-2 border-zinc-900 shadow-md',
              'ring-1 ring-zinc-500',
            )}
            style={{ backgroundColor: state.foregroundColor }}
            aria-label="Foreground"
          />
        </ColorPicker>
      </div>

      <p className="max-w-[52px] truncate text-center font-mono text-[9px] leading-tight text-zinc-500">
        {state.foregroundColor}
      </p>

      <div className="flex gap-0.5">
        <ToolTooltip
          label="Swap colors"
          description="Swaps the foreground and background colors."
          shortcut="X"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500"
            onClick={() => dispatch({ type: 'SWAP_COLORS' })}
          >
            <ArrowDownUp className="h-3.5 w-3.5" />
          </Button>
        </ToolTooltip>
        <ToolTooltip
          label="Default colors"
          description="Black foreground, white background."
          shortcut="D"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-ui-xs text-zinc-500"
            onClick={() => dispatch({ type: 'RESET_COLORS' })}
          >
            D
          </Button>
        </ToolTooltip>
      </div>
    </div>
  )
}
