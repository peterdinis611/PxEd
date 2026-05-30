import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { createLayer, cloneLayer, snapshotLayer, restoreLayerFromSnapshot, renderTextLayer } from '@/lib/canvas/layers'
import type {
  BlendMode,
  BrushSettings,
  HistoryEntry,
  Layer,
  MarqueeSettings,
  Selection,
  ShapeSettings,
  ToolName,
} from '@/types/editor'
import { DEFAULT_BRUSH, DEFAULT_MARQUEE, DEFAULT_SHAPE } from '@/types/editor'

const MAX_HISTORY = 50

export interface EditorState {
  layers: Layer[]
  activeLayerId: string | null
  tool: ToolName
  foregroundColor: string
  backgroundColor: string
  brush: BrushSettings
  shape: ShapeSettings
  marquee: MarqueeSettings
  snapToGrid: boolean
  gridSize: number
  eyedropperSample: number
  gradientAngle: number
  fillOpacity: number
  textUnderline: boolean
  textLineHeight: number
  contiguousWand: boolean
  zoom: number
  panX: number
  panY: number
  selection: Selection | null
  history: HistoryEntry[]
  historyIndex: number
  canvasWidth: number
  canvasHeight: number
  showGrid: boolean
  showRulers: boolean
  clipboard: ImageData | null
  magicWandTolerance: number
  fillTolerance: number
  textFont: string
  textSize: number
  textBold: boolean
  textItalic: boolean
  textAlign: CanvasTextAlign
  recentColors: string[]
  renderTick: number
  fitRequest: number
}

type Action =
  | { type: 'SET_TOOL'; tool: ToolName }
  | { type: 'SET_COLORS'; fg?: string; bg?: string }
  | { type: 'SWAP_COLORS' }
  | { type: 'RESET_COLORS' }
  | { type: 'SET_BRUSH'; brush: Partial<BrushSettings> }
  | { type: 'SET_SHAPE'; shape: Partial<ShapeSettings> }
  | { type: 'SET_MARQUEE'; marquee: Partial<MarqueeSettings> }
  | { type: 'SET_VIEWPORT'; zoom: number; panX: number; panY: number }
  | { type: 'SET_VIEW_OPTS'; patch: Partial<Pick<EditorState, 'snapToGrid' | 'gridSize' | 'showGrid' | 'showRulers'>> }
  | { type: 'SET_MISC_TOOL'; patch: Partial<Pick<EditorState, 'eyedropperSample' | 'gradientAngle' | 'fillOpacity' | 'contiguousWand' | 'textUnderline' | 'textLineHeight'>> }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_PAN'; panX: number; panY: number }
  | { type: 'SET_SELECTION'; selection: Selection | null }
  | { type: 'SET_LAYERS'; layers: Layer[] }
  | { type: 'SET_ACTIVE_LAYER'; id: string }
  | { type: 'UPDATE_LAYER'; id: string; patch: Partial<Layer> }
  | {
      type: 'ADD_LAYER'
      layer?: Layer
      name?: string
      fill?: string
      insertAboveActive?: boolean
    }
  | { type: 'DELETE_LAYER'; id: string }
  | { type: 'DUPLICATE_LAYER'; id: string }
  | { type: 'REORDER_LAYERS'; from: number; to: number }
  | { type: 'NEW_DOCUMENT'; width: number; height: number; bg: string }
  | { type: 'SET_CANVAS_SIZE'; width: number; height: number }
  | { type: 'PUSH_HISTORY'; description: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'JUMP_HISTORY'; index: number }
  | { type: 'TOGGLE_GRID' }
  | { type: 'TOGGLE_RULERS' }
  | { type: 'SET_CLIPBOARD'; data: ImageData | null }
  | { type: 'SET_TOLERANCE'; magic?: number; fill?: number }
  | { type: 'SET_TEXT_OPTS'; patch: Partial<Pick<EditorState, 'textFont' | 'textSize' | 'textBold' | 'textItalic' | 'textAlign'>> }
  | { type: 'ADD_RECENT_COLOR'; color: string }
  | { type: 'BUMP_RENDER' }
  | { type: 'LOAD_PROJECT'; state: Pick<EditorState, 'layers' | 'canvasWidth' | 'canvasHeight' | 'activeLayerId'> }
  | { type: 'REQUEST_FIT_TO_SCREEN' }

function pushHistory(state: EditorState, description: string): EditorState {
  const entry: HistoryEntry = {
    layers: state.layers.map(snapshotLayer),
    canvasWidth: state.canvasWidth,
    canvasHeight: state.canvasHeight,
    description,
    selection: state.selection,
  }
  let history = state.history.slice(0, state.historyIndex + 1)
  history.push(entry)
  if (history.length > MAX_HISTORY) history = history.slice(history.length - MAX_HISTORY)
  return {
    ...state,
    history,
    historyIndex: history.length - 1,
    renderTick: state.renderTick + 1,
  }
}

function restoreHistory(state: EditorState, index: number): EditorState {
  const entry = state.history[index]
  if (!entry) return state
  const layers = entry.layers.map((s) =>
    restoreLayerFromSnapshot(s, entry.canvasWidth, entry.canvasHeight),
  )
  layers.forEach((l) => {
    if (l.type === 'text') renderTextLayer(l)
  })
  return {
    ...state,
    layers,
    canvasWidth: entry.canvasWidth,
    canvasHeight: entry.canvasHeight,
    selection: entry.selection,
    historyIndex: index,
    renderTick: state.renderTick + 1,
  }
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, tool: action.tool }
    case 'SET_COLORS':
      return {
        ...state,
        foregroundColor: action.fg ?? state.foregroundColor,
        backgroundColor: action.bg ?? state.backgroundColor,
      }
    case 'SWAP_COLORS':
      return {
        ...state,
        foregroundColor: state.backgroundColor,
        backgroundColor: state.foregroundColor,
      }
    case 'RESET_COLORS':
      return { ...state, foregroundColor: '#000000', backgroundColor: '#ffffff' }
    case 'SET_BRUSH':
      return { ...state, brush: { ...state.brush, ...action.brush } }
    case 'SET_SHAPE':
      return { ...state, shape: { ...state.shape, ...action.shape } }
    case 'SET_MARQUEE':
      return { ...state, marquee: { ...state.marquee, ...action.marquee } }
    case 'SET_VIEWPORT':
      return {
        ...state,
        zoom: Math.min(3200, Math.max(5, action.zoom)),
        panX: action.panX,
        panY: action.panY,
      }
    case 'SET_VIEW_OPTS':
      return { ...state, ...action.patch }
    case 'SET_MISC_TOOL':
      return { ...state, ...action.patch }
    case 'SET_ZOOM':
      return { ...state, zoom: Math.min(3200, Math.max(5, action.zoom)) }
    case 'SET_PAN':
      return { ...state, panX: action.panX, panY: action.panY }
    case 'SET_SELECTION':
      return { ...state, selection: action.selection }
    case 'SET_LAYERS':
      return { ...state, layers: action.layers, renderTick: state.renderTick + 1 }
    case 'SET_ACTIVE_LAYER':
      return { ...state, activeLayerId: action.id }
    case 'UPDATE_LAYER': {
      const layers = state.layers.map((l) =>
        l.id === action.id ? { ...l, ...action.patch } : l,
      )
      return { ...state, layers, renderTick: state.renderTick + 1 }
    }
    case 'ADD_LAYER': {
      const layer =
        action.layer ??
        createLayer(
          state.canvasWidth,
          state.canvasHeight,
          action.name ?? `Layer ${state.layers.length + 1}`,
          action.fill !== undefined ? { fill: action.fill } : undefined,
        )
      const insertAbove = action.insertAboveActive !== false
      const activeIdx = state.activeLayerId
        ? state.layers.findIndex((l) => l.id === state.activeLayerId)
        : -1
      let layers: Layer[]
      if (insertAbove && activeIdx >= 0) {
        layers = [...state.layers]
        layers.splice(activeIdx + 1, 0, layer)
      } else {
        layers = [...state.layers, layer]
      }
      return pushHistory(
        { ...state, layers, activeLayerId: layer.id },
        'New Layer',
      )
    }
    case 'DELETE_LAYER': {
      if (state.layers.length <= 1) return state
      const layers = state.layers.filter((l) => l.id !== action.id)
      const activeLayerId =
        state.activeLayerId === action.id
          ? layers[layers.length - 1]!.id
          : state.activeLayerId
      return pushHistory({ ...state, layers, activeLayerId }, 'Delete Layer')
    }
    case 'DUPLICATE_LAYER': {
      const src = state.layers.find((l) => l.id === action.id)
      if (!src) return state
      const dup = cloneLayer(src)
      const idx = state.layers.findIndex((l) => l.id === action.id)
      const layers = [...state.layers]
      layers.splice(idx + 1, 0, dup)
      return pushHistory(
        { ...state, layers, activeLayerId: dup.id },
        'Duplicate Layer',
      )
    }
    case 'REORDER_LAYERS': {
      const layers = [...state.layers]
      const [item] = layers.splice(action.from, 1)
      if (!item) return state
      layers.splice(action.to, 0, item)
      return { ...state, layers, renderTick: state.renderTick + 1 }
    }
    case 'NEW_DOCUMENT': {
      const bgLayer = createLayer(
        action.width,
        action.height,
        'Background',
        { fill: action.bg },
      )
      const entry: HistoryEntry = {
        layers: [snapshotLayer(bgLayer)],
        canvasWidth: action.width,
        canvasHeight: action.height,
        description: 'New Document',
        selection: null,
      }
      return {
        ...state,
        layers: [bgLayer],
        activeLayerId: bgLayer.id,
        canvasWidth: action.width,
        canvasHeight: action.height,
        selection: null,
        history: [entry],
        historyIndex: 0,
        zoom: 100,
        panX: 40,
        panY: 40,
        renderTick: state.renderTick + 1,
        fitRequest: state.fitRequest + 1,
      }
    }
    case 'SET_CANVAS_SIZE': {
      const layers = state.layers.map((l) => {
        const nc = document.createElement('canvas')
        nc.width = action.width
        nc.height = action.height
        const ctx = nc.getContext('2d')!
        ctx.drawImage(l.canvas, 0, 0)
        return { ...l, canvas: nc }
      })
      return pushHistory(
        {
          ...state,
          layers,
          canvasWidth: action.width,
          canvasHeight: action.height,
          fitRequest: state.fitRequest + 1,
        },
        'Canvas Size',
      )
    }
    case 'PUSH_HISTORY':
      return pushHistory(state, action.description)
    case 'UNDO':
      if (state.historyIndex <= 0) return state
      return restoreHistory(state, state.historyIndex - 1)
    case 'REDO':
      if (state.historyIndex >= state.history.length - 1) return state
      return restoreHistory(state, state.historyIndex + 1)
    case 'JUMP_HISTORY':
      return restoreHistory(state, action.index)
    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid }
    case 'TOGGLE_RULERS':
      return { ...state, showRulers: !state.showRulers }
    case 'SET_CLIPBOARD':
      return { ...state, clipboard: action.data }
    case 'SET_TOLERANCE':
      return {
        ...state,
        magicWandTolerance: action.magic ?? state.magicWandTolerance,
        fillTolerance: action.fill ?? state.fillTolerance,
      }
    case 'SET_TEXT_OPTS':
      return { ...state, ...action.patch }
    case 'ADD_RECENT_COLOR': {
      const recent = [
        action.color,
        ...state.recentColors.filter((c) => c !== action.color),
      ].slice(0, 10)
      return { ...state, recentColors: recent }
    }
    case 'BUMP_RENDER':
      return { ...state, renderTick: state.renderTick + 1 }
    case 'REQUEST_FIT_TO_SCREEN':
      return { ...state, fitRequest: state.fitRequest + 1 }
    case 'LOAD_PROJECT':
      return {
        ...state,
        ...action.state,
        history: [
          {
            layers: action.state.layers.map(snapshotLayer),
            canvasWidth: action.state.canvasWidth,
            canvasHeight: action.state.canvasHeight,
            description: 'Open Project',
            selection: null,
          },
        ],
        historyIndex: 0,
        renderTick: state.renderTick + 1,
      }
    default:
      return state
  }
}

function createInitialState(): EditorState {
  const bgLayer = createLayer(800, 600, 'Background', { fill: '#ffffff' })
  const entry: HistoryEntry = {
    layers: [snapshotLayer(bgLayer)],
    canvasWidth: 800,
    canvasHeight: 600,
    description: 'New Document',
    selection: null,
  }
  return {
    layers: [bgLayer],
    activeLayerId: bgLayer.id,
    tool: 'brush',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    brush: { ...DEFAULT_BRUSH },
    shape: { ...DEFAULT_SHAPE },
    marquee: { ...DEFAULT_MARQUEE },
    snapToGrid: false,
    gridSize: 20,
    eyedropperSample: 1,
    gradientAngle: 0,
    fillOpacity: 100,
    textUnderline: false,
    textLineHeight: 120,
    contiguousWand: true,
    zoom: 100,
    panX: 40,
    panY: 40,
    selection: null,
    history: [entry],
    historyIndex: 0,
    canvasWidth: 800,
    canvasHeight: 600,
    showGrid: false,
    showRulers: true,
    clipboard: null,
    magicWandTolerance: 32,
    fillTolerance: 32,
    textFont: 'Arial',
    textSize: 24,
    textBold: false,
    textItalic: false,
    textAlign: 'left',
    recentColors: [],
    renderTick: 0,
    fitRequest: 1,
  }
}

export interface AddLayerOptions {
  /** Custom layer instance; skips default empty layer creation. */
  layer?: Layer
  name?: string
  /** Solid fill color, e.g. `#ffffff`. Omit for a transparent layer. */
  fill?: string
  /** When true (default), inserts above the active layer in the stack. */
  insertAboveActive?: boolean
}

interface EditorContextValue {
  state: EditorState
  dispatch: React.Dispatch<Action>
  activeLayer: Layer | undefined
  commitHistory: (description: string) => void
  updateActiveLayerCanvas: (fn: (ctx: CanvasRenderingContext2D) => void) => void
  addLayer: (options?: AddLayerOptions) => Layer
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  const activeLayer = useMemo(
    () => state.layers.find((l) => l.id === state.activeLayerId),
    [state.layers, state.activeLayerId],
  )

  const commitHistory = useCallback((description: string) => {
    dispatch({ type: 'PUSH_HISTORY', description })
  }, [])

  const updateActiveLayerCanvas = useCallback(
    (fn: (ctx: CanvasRenderingContext2D) => void) => {
      const layer = state.layers.find((l) => l.id === state.activeLayerId)
      if (!layer || layer.locked) return
      const ctx = layer.canvas.getContext('2d')
      if (!ctx) return
      fn(ctx)
      if (layer.type === 'text' && layer.textData) renderTextLayer(layer)
      dispatch({ type: 'BUMP_RENDER' })
    },
    [state.layers, state.activeLayerId],
  )

  const addLayer = useCallback(
    (options?: AddLayerOptions): Layer => {
      const layer =
        options?.layer ??
        createLayer(
          state.canvasWidth,
          state.canvasHeight,
          options?.name ?? `Layer ${state.layers.length + 1}`,
          options?.fill !== undefined ? { fill: options.fill } : undefined,
        )
      dispatch({
        type: 'ADD_LAYER',
        layer,
        insertAboveActive: options?.insertAboveActive,
      })
      return layer
    },
    [state.canvasWidth, state.canvasHeight, state.layers.length, dispatch],
  )

  const value = useMemo(
    () => ({
      state,
      dispatch,
      activeLayer,
      commitHistory,
      updateActiveLayerCanvas,
      addLayer,
    }),
    [state, activeLayer, commitHistory, updateActiveLayerCanvas, addLayer],
  )

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  )
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}

export type { BlendMode, ToolName, Layer, Selection }
