import { generateId } from '@/lib/utils'
import type { BlendMode, Layer, LayerSnapshot, TextData } from '@/types/editor'

export function createLayerCanvas(
  width: number,
  height: number,
  fill?: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  if (fill) {
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, width, height)
  }
  return canvas
}

export function createLayer(
  width: number,
  height: number,
  name: string,
  options?: {
    fill?: string
    type?: Layer['type']
    textData?: TextData
  },
): Layer {
  return {
    id: generateId(),
    name,
    visible: true,
    locked: false,
    opacity: 100,
    blendMode: 'normal' as BlendMode,
    canvas: createLayerCanvas(width, height, options?.fill),
    x: 0,
    y: 0,
    type: options?.type ?? 'pixel',
    textData: options?.textData,
  }
}

export function cloneLayer(layer: Layer): Layer {
  const canvas = createLayerCanvas(layer.canvas.width, layer.canvas.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(layer.canvas, 0, 0)
  return {
    ...layer,
    id: generateId(),
    name: `${layer.name} copy`,
    canvas,
    textData: layer.textData ? { ...layer.textData } : undefined,
  }
}

export function snapshotLayer(layer: Layer): LayerSnapshot {
  const ctx = layer.canvas.getContext('2d')!
  return {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    locked: layer.locked,
    opacity: layer.opacity,
    blendMode: layer.blendMode,
    imageData: ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height),
    x: layer.x,
    y: layer.y,
    type: layer.type,
    textData: layer.textData ? { ...layer.textData } : undefined,
  }
}

export function restoreLayerFromSnapshot(
  snap: LayerSnapshot,
  width: number,
  height: number,
): Layer {
  const canvas = createLayerCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(snap.imageData, 0, 0)
  return {
    id: snap.id,
    name: snap.name,
    visible: snap.visible,
    locked: snap.locked,
    opacity: snap.opacity,
    blendMode: snap.blendMode,
    canvas,
    x: snap.x,
    y: snap.y,
    type: snap.type,
    textData: snap.textData ? { ...snap.textData } : undefined,
  }
}

export function renderTextLayer(layer: Layer): void {
  if (layer.type !== 'text' || !layer.textData) return
  const ctx = layer.canvas.getContext('2d')!
  const { text, font, size, color, bold, italic, align, x, y } = layer.textData
  ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height)
  const style = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px ${font}`
  ctx.font = style
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  const lines = text.split('\n')
  const lineHeight = size * 1.2
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineHeight)
  })
}
