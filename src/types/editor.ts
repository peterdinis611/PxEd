export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'

export type ToolName =
  | 'move'
  | 'marquee-rect'
  | 'marquee-ellipse'
  | 'lasso'
  | 'magic-wand'
  | 'crop'
  | 'brush'
  | 'pencil'
  | 'eraser'
  | 'fill'
  | 'gradient'
  | 'eyedropper'
  | 'text'
  | 'shape-rect'
  | 'shape-ellipse'
  | 'shape-line'
  | 'zoom'

export interface TextData {
  text: string
  font: string
  size: number
  color: string
  bold: boolean
  italic: boolean
  align: CanvasTextAlign
  x: number
  y: number
}

export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  blendMode: BlendMode
  canvas: HTMLCanvasElement
  x: number
  y: number
  type: 'pixel' | 'text' | 'shape'
  textData?: TextData
}

export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

export interface LassoPath {
  type: 'lasso'
  points: { x: number; y: number }[]
}

export interface EllipseSelection {
  type: 'ellipse'
  x: number
  y: number
  width: number
  height: number
}

export type Selection =
  | ({ type: 'rect' } & SelectionRect)
  | EllipseSelection
  | LassoPath

export interface LayerSnapshot {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  blendMode: BlendMode
  imageData: ImageData
  x: number
  y: number
  type: 'pixel' | 'text' | 'shape'
  textData?: TextData
}

export interface HistoryEntry {
  layers: LayerSnapshot[]
  canvasWidth: number
  canvasHeight: number
  description: string
  selection: Selection | null
}

export interface BrushSettings {
  size: number
  hardness: number
  opacity: number
  flow: number
  spacing: number
  blendMode: 'source-over' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
  smoothing: number
}

export interface ShapeSettings {
  fillColor: string
  strokeColor: string
  strokeWidth: number
  filled: boolean
  cornerRadius: number
  lineCap: CanvasLineCap
  lineJoin: CanvasLineJoin
}

export interface MarqueeSettings {
  feather: number
  antiAlias: boolean
  fixedRatio: boolean
  ratioW: number
  ratioH: number
}

export interface ViewSettings {
  snapToGrid: boolean
  gridSize: number
  showGrid: boolean
  showRulers: boolean
}

export const BLEND_MODE_MAP: Record<BlendMode, GlobalCompositeOperation> = {
  normal: 'source-over',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
  'color-dodge': 'color-dodge',
  'color-burn': 'color-burn',
  'hard-light': 'hard-light',
  'soft-light': 'soft-light',
  difference: 'difference',
  exclusion: 'exclusion',
}

export const DEFAULT_BRUSH: BrushSettings = {
  size: 12,
  hardness: 80,
  opacity: 100,
  flow: 100,
  spacing: 25,
  blendMode: 'source-over',
  smoothing: 50,
}

export const DEFAULT_SHAPE: ShapeSettings = {
  fillColor: '#000000',
  strokeColor: '#000000',
  strokeWidth: 2,
  filled: true,
  cornerRadius: 0,
  lineCap: 'round',
  lineJoin: 'round',
}

export const DEFAULT_MARQUEE: MarqueeSettings = {
  feather: 0,
  antiAlias: true,
  fixedRatio: false,
  ratioW: 1,
  ratioH: 1,
}
