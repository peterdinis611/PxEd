import { useCallback, useEffect, useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h.padEnd(6, '0').slice(0, 6)
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(v).toString(16).padStart(2, '0'))
      .join('')
  )
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  s /= 100
  l /= 100
  if (s === 0) {
    const v = l * 255
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ]
}

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  recentColors?: string[]
  children: React.ReactNode
}

export function ColorPicker({
  color,
  onChange,
  recentColors = [],
  children,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [rgb, setRgb] = useState(() => hexToRgb(color))
  const [hsl, setHsl] = useState(() => {
    const [r, g, b] = hexToRgb(color)
    return rgbToHsl(r, g, b)
  })
  const svRef = useRef<HTMLCanvasElement>(null)
  const hueRef = useRef<HTMLCanvasElement>(null)

  const syncFromColor = useCallback((c: string) => {
    const [r, g, b] = hexToRgb(c)
    setRgb([r, g, b])
    setHsl(rgbToHsl(r, g, b))
  }, [])

  useEffect(() => {
    syncFromColor(color)
  }, [color, syncFromColor])

  const emit = (r: number, g: number, b: number) => {
    const hex = rgbToHex(r, g, b)
    onChange(hex)
    setRgb([r, g, b])
    setHsl(rgbToHsl(r, g, b))
  }

  const drawSv = useCallback(() => {
    const canvas = svRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    const hueColor = `hsl(${hsl[0]}, 100%, 50%)`
    ctx.fillStyle = hueColor
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
  }, [])

  useEffect(() => {
    if (open) {
      drawSv()
      drawHue()
    }
  }, [open, drawSv, drawHue, hsl[0]])

  const onSvClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const [r, g, b] = hslToRgb(hsl[0], Math.round(x * 100), Math.round((1 - y) * 100))
    emit(r, g, b)
  }

  const onHueClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const h = Math.round(((e.clientX - rect.left) / rect.width) * 360)
    const [r, g, b] = hslToRgb(h, hsl[1], hsl[2])
    emit(r, g, b)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <canvas
          ref={svRef}
          width={200}
          height={140}
          className="w-full cursor-crosshair rounded border border-zinc-600"
          onClick={onSvClick}
        />
        <canvas
          ref={hueRef}
          width={200}
          height={12}
          className="mt-2 w-full cursor-pointer rounded"
          onClick={onHueClick}
        />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <Label>Hex</Label>
            <Input
              value={rgbToHex(rgb[0], rgb[1], rgb[2])}
              onChange={(e) => {
                const v = e.target.value
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                  onChange(v)
                  syncFromColor(v)
                }
              }}
            />
          </div>
          {(['R', 'G', 'B'] as const).map((label, i) => (
            <div key={label}>
              <Label>{label}</Label>
              <Input
                type="number"
                min={0}
                max={255}
                value={rgb[i]}
                onChange={(e) => {
                  const next = [...rgb] as [number, number, number]
                  next[i] = +e.target.value
                  emit(next[0], next[1], next[2])
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-1">
          <Label>HSL</Label>
          {(['H', 'S', 'L'] as const).map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-4 text-xs text-zinc-500">{label}</span>
              <Slider
                value={[hsl[i]!]}
                max={i === 0 ? 360 : 100}
                step={1}
                onValueChange={([v]) => {
                  const next = [...hsl] as [number, number, number]
                  next[i] = v!
                  const [r, g, b] = hslToRgb(next[0], next[1], next[2])
                  emit(r, g, b)
                }}
                className="flex-1"
              />
            </div>
          ))}
        </div>
        {recentColors.length > 0 && (
          <div className="mt-3 flex gap-1">
            {recentColors.map((c) => (
              <button
                key={c}
                type="button"
                className={cn(
                  'h-4 w-4 rounded border border-zinc-600',
                  c === color && 'ring-2 ring-blue-500',
                )}
                style={{ backgroundColor: c }}
                onClick={() => onChange(c)}
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
