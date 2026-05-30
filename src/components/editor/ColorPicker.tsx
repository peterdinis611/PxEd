import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Pipette } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  COLOR_PRESETS,
  hexToRgb,
  hslToRgb,
  normalizeHex,
  rgbToHex,
  rgbToHsl,
} from '@/lib/color'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  recentColors?: string[]
  label?: string
  children: React.ReactNode
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function ColorPicker({
  color,
  onChange,
  recentColors = [],
  label,
  children,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [hexInput, setHexInput] = useState(color)
  const [rgb, setRgb] = useState(() => hexToRgb(color))
  const [hsl, setHsl] = useState(() => rgbToHsl(...hexToRgb(color)))
  const svRef = useRef<HTMLCanvasElement>(null)
  const hueRef = useRef<HTMLCanvasElement>(null)
  const dragSv = useRef(false)
  const dragHue = useRef(false)

  const syncFromColor = useCallback((c: string) => {
    const [r, g, b] = hexToRgb(c)
    setRgb([r, g, b])
    setHsl(rgbToHsl(r, g, b))
    setHexInput(c)
  }, [])

  useEffect(() => {
    syncFromColor(color)
  }, [color, syncFromColor])

  const emit = useCallback(
    (r: number, g: number, b: number) => {
      const hex = rgbToHex(r, g, b)
      onChange(hex)
      setRgb([r, g, b])
      setHsl(rgbToHsl(r, g, b))
      setHexInput(hex)
    },
    [onChange],
  )

  const pickSv = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = svRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = clamp((clientX - rect.left) / rect.width, 0, 1)
      const y = clamp((clientY - rect.top) / rect.height, 0, 1)
      const [r, g, b] = hslToRgb(hsl[0], Math.round(x * 100), Math.round((1 - y) * 100))
      emit(r, g, b)
    },
    [emit, hsl],
  )

  const pickHue = useCallback(
    (clientX: number) => {
      const canvas = hueRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const h = Math.round(clamp((clientX - rect.left) / rect.width, 0, 1) * 360)
      const [r, g, b] = hslToRgb(h, hsl[1], hsl[2])
      emit(r, g, b)
    },
    [emit, hsl],
  )

  const drawSv = useCallback(() => {
    const canvas = svRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    ctx.fillStyle = `hsl(${hsl[0]}, 100%, 50%)`
    ctx.fillRect(0, 0, w, h)
    const white = ctx.createLinearGradient(0, 0, w, 0)
    white.addColorStop(0, '#fff')
    white.addColorStop(1, 'transparent')
    ctx.fillStyle = white
    ctx.fillRect(0, 0, w, h)
    const black = ctx.createLinearGradient(0, 0, 0, h)
    black.addColorStop(0, 'transparent')
    black.addColorStop(1, '#000')
    ctx.fillStyle = black
    ctx.fillRect(0, 0, w, h)

    const sx = (hsl[1] / 100) * w
    const sy = (1 - hsl[2] / 100) * h
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(sx, sy, 6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(sx, sy, 6, 0, Math.PI * 2)
    ctx.stroke()
  }, [hsl])

  const drawHue = useCallback(() => {
    const canvas = hueRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, canvas.width, 0)
    for (let i = 0; i <= 6; i++) {
      g.addColorStop(i / 6, `hsl(${i * 60}, 100%, 50%)`)
    }
    ctx.fillStyle = g
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const x = (hsl[0] / 360) * canvas.width
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.fillRect(x - 2, 0, 4, canvas.height)
    ctx.strokeRect(x - 2, 0, 4, canvas.height)
  }, [hsl])

  useEffect(() => {
    if (open) {
      drawSv()
      drawHue()
    }
  }, [open, drawSv, drawHue])

  useEffect(() => {
    if (!open) return
    const onMove = (e: PointerEvent) => {
      if (dragSv.current) pickSv(e.clientX, e.clientY)
      if (dragHue.current) pickHue(e.clientX)
    }
    const onUp = () => {
      dragSv.current = false
      dragHue.current = false
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [open, pickSv, pickHue])

  const copyHex = async () => {
    try {
      await navigator.clipboard.writeText(rgbToHex(rgb[0], rgb[1], rgb[2]))
    } catch {
      /* ignore */
    }
  }

  const hex = rgbToHex(rgb[0], rgb[1], rgb[2])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start" side="right" sideOffset={8}>
        {label ? (
          <p className="mb-2 text-ui-xs font-semibold uppercase tracking-wide text-zinc-500">
            {label}
          </p>
        ) : null}

        <div className="mb-3 flex items-center gap-2">
          <div
            className="h-12 w-12 shrink-0 rounded-lg border border-zinc-600 shadow-inner"
            style={{ backgroundColor: hex }}
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex gap-1">
              <Input
                value={hexInput}
                className="h-8 flex-1 font-mono text-ui-xs uppercase"
                onChange={(e) => setHexInput(e.target.value)}
                onBlur={() => {
                  const n = normalizeHex(hexInput)
                  if (n) {
                    onChange(n)
                    syncFromColor(n)
                  } else {
                    setHexInput(hex)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const n = normalizeHex(hexInput)
                    if (n) {
                      onChange(n)
                      syncFromColor(n)
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                title="Copy hex"
                onClick={copyHex}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-ui-xs text-zinc-500">
              <Pipette className="h-3.5 w-3.5" />
              System picker
              <input
                type="color"
                value={hex}
                className="ml-auto h-7 w-10 cursor-pointer rounded border border-zinc-600 bg-transparent p-0"
                onChange={(e) => {
                  onChange(e.target.value)
                  syncFromColor(e.target.value)
                }}
              />
            </label>
          </div>
        </div>

        <canvas
          ref={svRef}
          width={248}
          height={160}
          className="w-full cursor-crosshair rounded-md border border-zinc-600 touch-none"
          onPointerDown={(e) => {
            dragSv.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            pickSv(e.clientX, e.clientY)
          }}
        />
        <canvas
          ref={hueRef}
          width={248}
          height={14}
          className="mt-2 w-full cursor-pointer rounded touch-none"
          onPointerDown={(e) => {
            dragHue.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            pickHue(e.clientX)
          }}
        />

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {(['R', 'G', 'B'] as const).map((lbl, i) => (
            <div key={lbl}>
              <Label className="text-ui-xs text-zinc-500">{lbl}</Label>
              <Input
                type="number"
                min={0}
                max={255}
                className="mt-0.5 h-8 px-1.5 text-center text-ui-xs tabular-nums"
                value={rgb[i]}
                onChange={(e) => {
                  const next = [...rgb] as [number, number, number]
                  next[i] = clamp(+e.target.value, 0, 255)
                  emit(next[0], next[1], next[2])
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-3">
          <Label className="text-ui-xs text-zinc-500">Presets</Label>
          <div className="mt-1.5 grid grid-cols-8 gap-1">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                className={cn(
                  'h-6 w-6 rounded border border-zinc-600/80 transition-transform hover:scale-110',
                  c === hex && 'ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-800',
                )}
                style={{ backgroundColor: c }}
                onClick={() => {
                  onChange(c)
                  syncFromColor(c)
                }}
              />
            ))}
          </div>
        </div>

        {recentColors.length > 0 && (
          <div className="mt-3">
            <Label className="text-ui-xs text-zinc-500">Recent</Label>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {recentColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  className={cn(
                    'h-6 w-6 rounded border border-zinc-600',
                    c === hex && 'ring-2 ring-blue-500',
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    onChange(c)
                    syncFromColor(c)
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
