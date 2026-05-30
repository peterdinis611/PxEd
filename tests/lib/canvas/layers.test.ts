import { describe, expect, it } from 'vitest'
import {
  cloneLayer,
  restoreLayerFromSnapshot,
  snapshotLayer,
} from '@/lib/canvas/layers'
import { createFilledLayer } from '@tests/helpers'

describe('snapshotLayer / restoreLayerFromSnapshot', () => {
  it('round-trips pixel data and metadata', () => {
    const layer = createFilledLayer(64, 48, 'Art')
    layer.x = 5
    layer.y = 10
    layer.opacity = 80
    layer.rotation = 15

    const snap = snapshotLayer(layer)
    const restored = restoreLayerFromSnapshot(
      snap,
      snap.imageData.width,
      snap.imageData.height,
    )

    expect(restored.name).toBe('Art')
    expect(restored.x).toBe(5)
    expect(restored.y).toBe(10)
    expect(restored.opacity).toBe(80)
    expect(restored.rotation).toBe(15)
    expect(restored.canvas.width).toBe(64)
    expect(restored.canvas.height).toBe(48)

    const src = layer.canvas.getContext('2d')!.getImageData(30, 30, 1, 1).data
    const dst = restored.canvas.getContext('2d')!.getImageData(30, 30, 1, 1).data
    expect(dst[3]).toBe(src[3])
  })
})

describe('cloneLayer', () => {
  it('copies pixels with a new id and name', () => {
    const layer = createFilledLayer(40, 40, 'Original')
    const copy = cloneLayer(layer)
    expect(copy.id).not.toBe(layer.id)
    expect(copy.name).toBe('Original copy')
    expect(copy.canvas.width).toBe(40)
  })
})
