import type { Layer, LayerSnapshot } from '@/types/editor'
import {
  snapshotLayer,
  restoreLayerFromSnapshot,
  createLayer,
} from '@/lib/canvas/layers'
import { drawLayerWithTransform } from '@/lib/canvas/transform'

export function exportFlattenedPng(
  layers: Layer[],
  width: number,
  height: number,
): void {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  for (const layer of layers) {
    if (!layer.visible) continue
    ctx.save()
    ctx.globalAlpha = layer.opacity / 100
    ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation
    drawLayerWithTransform(ctx, layer)
    ctx.restore()
  }

  downloadCanvas(canvas, 'image.png')
}

export function exportJpeg(
  layers: Layer[],
  width: number,
  height: number,
  quality: number,
): void {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  for (const layer of layers) {
    if (!layer.visible) continue
    ctx.save()
    ctx.globalAlpha = layer.opacity / 100
    drawLayerWithTransform(ctx, layer)
    ctx.restore()
  }
  const link = document.createElement('a')
  link.download = 'image.jpg'
  link.href = canvas.toDataURL('image/jpeg', quality / 100)
  link.click()
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export interface ProjectJson {
  version: 1
  canvasWidth: number
  canvasHeight: number
  layers: LayerSnapshot[]
  activeLayerId: string | null
}

export function exportProjectJson(
  layers: Layer[],
  canvasWidth: number,
  canvasHeight: number,
  activeLayerId: string | null,
): void {
  const data: ProjectJson = {
    version: 1,
    canvasWidth,
    canvasHeight,
    layers: layers.map(snapshotLayer),
    activeLayerId,
  }
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = 'project.pxed.json'
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

export function parseProjectJson(json: string): ProjectJson {
  const data = JSON.parse(json) as ProjectJson
  if (!data.layers || !data.canvasWidth) throw new Error('Invalid project file')
  return data
}

export function loadImageToLayer(
  img: HTMLImageElement,
  width: number,
  height: number,
): Layer[] {
  const layer = createLayer(width, height, 'Imported')
  const ctx = layer.canvas.getContext('2d')!
  const scale = Math.min(width / img.width, height / img.height, 1)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h)
  return [layer]
}

export function restoreProject(data: ProjectJson) {
  const layers = data.layers.map((s) =>
    restoreLayerFromSnapshot(s, data.canvasWidth, data.canvasHeight),
  )
  return { layers, canvasWidth: data.canvasWidth, canvasHeight: data.canvasHeight, activeLayerId: data.activeLayerId ?? layers[0]?.id ?? null }
}
