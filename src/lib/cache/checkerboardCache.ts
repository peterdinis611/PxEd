import { drawCheckerboard } from '@/lib/canvas/composite'
import { LruCache } from '@/lib/cache/lruCache'

const cache = new LruCache<string, HTMLCanvasElement>(12)

export function getCheckerboardCanvas(width: number, height: number): HTMLCanvasElement {
  const w = Math.max(1, Math.floor(width))
  const h = Math.max(1, Math.floor(height))
  const key = `${w}x${h}`

  const hit = cache.get(key)
  if (hit && hit.width === w && hit.height === h) return hit

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) drawCheckerboard(ctx, w, h)
  cache.set(key, canvas)
  return canvas
}

export function clearCheckerboardCache(): void {
  cache.clear()
}
