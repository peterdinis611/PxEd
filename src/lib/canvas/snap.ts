/** Snap document coordinates to grid when enabled. */
export function snapCoord(
  value: number,
  gridSize: number,
  enabled: boolean,
): number {
  if (!enabled || gridSize <= 0) return value
  return Math.round(value / gridSize) * gridSize
}

export function snapPoint(
  x: number,
  y: number,
  gridSize: number,
  enabled: boolean,
): { x: number; y: number } {
  return {
    x: snapCoord(x, gridSize, enabled),
    y: snapCoord(y, gridSize, enabled),
  }
}
