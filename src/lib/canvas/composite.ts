import { BLEND_MODE_MAP } from '@/types/editor'
import type { Layer } from '@/types/editor'
import {
  getViewportLayout,
  type ViewportLayout,
} from '@/lib/canvas/viewport'

function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cell = 12,
): void {
  ctx.fillStyle = '#2a2a2e'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#333338'
  for (let y = 0; y < height; y += cell) {
    for (let x = 0; x < width; x += cell) {
      if ((x / cell + y / cell) % 2 === 0) {
        ctx.fillRect(x, y, cell, cell)
      }
    }
  }
}

export function renderComposite(
  displayCanvas: HTMLCanvasElement,
  layers: Layer[],
  docWidth: number,
  docHeight: number,
  viewportW: number,
  viewportH: number,
  zoom: number,
  panX: number,
  panY: number,
): ViewportLayout {
  const layout = getViewportLayout(
    viewportW,
    viewportH,
    docWidth,
    docHeight,
    zoom,
    panX,
    panY,
    0,
  )

  const { canvasW, canvasH, scale, offsetX, offsetY } = layout

  if (displayCanvas.width !== canvasW || displayCanvas.height !== canvasH) {
    displayCanvas.width = canvasW
    displayCanvas.height = canvasH
  }

  const ctx = displayCanvas.getContext('2d')!
  ctx.clearRect(0, 0, canvasW, canvasH)
  drawCheckerboard(ctx, canvasW, canvasH)

  ctx.save()
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, docWidth, docHeight)

  for (const layer of layers) {
    if (!layer.visible) continue
    ctx.save()
    ctx.globalAlpha = layer.opacity / 100
    ctx.globalCompositeOperation = BLEND_MODE_MAP[layer.blendMode]
    ctx.drawImage(layer.canvas, layer.x, layer.y)
    ctx.restore()
  }

  ctx.restore()

  return layout
}

export function screenToDoc(
  screenX: number,
  screenY: number,
  rect: DOMRect,
  layout: Pick<ViewportLayout, 'scale' | 'offsetX' | 'offsetY'>,
): { x: number; y: number } {
  const localX = screenX - rect.left
  const localY = screenY - rect.top
  return {
    x: (localX - layout.offsetX) / layout.scale,
    y: (localY - layout.offsetY) / layout.scale,
  }
}
