import { describe, expect, it } from 'vitest'
import {
  canRotateLayer,
  findLayerAtPoint,
  getLayerCenter,
  isDocumentBackdropLayer,
  isNearRotateHandle,
  pointInLayerBounds,
} from '@/lib/canvas/layerBounds'
import { createBackdropLayer, createFilledLayer, createTestLayer } from '@tests/helpers'

describe('getLayerCenter', () => {
  it('returns the geometric center of the layer', () => {
    const layer = createTestLayer(100, 50)
    layer.x = 10
    layer.y = 20
    expect(getLayerCenter(layer)).toEqual({ x: 60, y: 45 })
  })
})

describe('isDocumentBackdropLayer', () => {
  it('detects full-bleed Background layers', () => {
    const bg = createBackdropLayer(800, 600)
    expect(isDocumentBackdropLayer(bg, 800, 600)).toBe(true)
  })

  it('does not flag normal content layers', () => {
    const layer = createFilledLayer(100, 100, 'Layer 1')
    expect(isDocumentBackdropLayer(layer, 800, 600)).toBe(false)
  })
})

describe('canRotateLayer', () => {
  it('blocks locked and backdrop layers', () => {
    const bg = createBackdropLayer(800, 600)
    expect(canRotateLayer(bg, 800, 600)).toBe(false)

    const layer = createFilledLayer()
    layer.locked = true
    expect(canRotateLayer(layer, 800, 600)).toBe(false)

    const free = createFilledLayer()
    expect(canRotateLayer(free, 800, 600)).toBe(true)
  })
})

describe('pointInLayerBounds', () => {
  it('returns true inside opaque pixels', () => {
    const layer = createFilledLayer(100, 100)
    expect(pointInLayerBounds(layer, 50, 50)).toBe(true)
  })

  it('returns false outside painted content', () => {
    const layer = createFilledLayer(100, 100)
    expect(pointInLayerBounds(layer, 2, 2)).toBe(false)
  })
})

describe('findLayerAtPoint', () => {
  it('returns the topmost hit layer', () => {
    const bottom = createFilledLayer(100, 100, 'Bottom')
    const top = createFilledLayer(60, 60, 'Top')
    top.x = 20
    top.y = 20
    const hit = findLayerAtPoint([bottom, top], 40, 40, 800, 600)
    expect(hit?.name).toBe('Top')
  })

  it('skips invisible, locked, and backdrop layers', () => {
    const bg = createBackdropLayer(200, 200)
    const hidden = createFilledLayer(200, 200, 'Hidden')
    hidden.visible = false
    const hit = findLayerAtPoint([bg, hidden], 50, 50, 200, 200)
    expect(hit).toBeNull()
  })
})

describe('isNearRotateHandle', () => {
  it('is true near the rotate handle', () => {
    const layer = createFilledLayer(80, 80)
    layer.x = 100
    layer.y = 100
    const { x, y } = layer
    const center = { x: x + 40, y: y + 40 }
    expect(isNearRotateHandle(layer, center.x, center.y - 50, 30)).toBe(true)
  })
})
