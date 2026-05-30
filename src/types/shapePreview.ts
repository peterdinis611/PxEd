export type ShapeDrawKind =
  | 'shape-rect'
  | 'shape-ellipse'
  | 'shape-line'
  | 'gradient'

export interface ShapeDrawPreview {
  kind: ShapeDrawKind
  startX: number
  startY: number
  endX: number
  endY: number
}
