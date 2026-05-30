import type { UseHotkeyDefinition } from '@tanstack/react-hotkeys'
import type { ToolName } from '@/types/editor'

const TOOL_KEYS: Record<string, ToolName> = {
  v: 'move',
  h: 'hand',
  m: 'marquee-rect',
  o: 'marquee-ellipse',
  l: 'lasso',
  w: 'magic-wand',
  c: 'crop',
  b: 'brush',
  p: 'pencil',
  e: 'eraser',
  g: 'fill',
  i: 'eyedropper',
  t: 'text',
  u: 'shape-rect',
  n: 'shape-line',
  z: 'zoom',
}

export interface EditorHotkeyDeps {
  setSpacePan: (value: boolean) => void
  onSelectAll: () => void
  onDeselect: () => void
  onCopy: () => void
  onPaste: () => void
  onClear: () => void
  dispatch: React.Dispatch<{
    type: string
    [key: string]: unknown
  }>
  addLayer: () => void
  rotateActiveLayer: (delta: number) => void
  activeLayerId: string | null
  activeLayerLocked: boolean
  brushSize: number
  setTool: (tool: ToolName) => void
  setBrushSize: (size: number) => void
  swapColors: () => void
  resetColors: () => void
}

const prevent = { preventDefault: true } as const

export function buildEditorHotkeyDefinitions(
  deps: EditorHotkeyDeps,
): UseHotkeyDefinition[] {
  const {
    setSpacePan,
    onSelectAll,
    onDeselect,
    onCopy,
    onPaste,
    onClear,
    dispatch,
    addLayer,
    rotateActiveLayer,
    activeLayerId,
    activeLayerLocked,
    brushSize,
    setTool,
    setBrushSize,
    swapColors,
    resetColors,
  } = deps

  const hotkeys: UseHotkeyDefinition[] = [
    {
      hotkey: 'Space',
      callback: () => setSpacePan(true),
      options: { eventType: 'keydown', ...prevent },
    },
    {
      hotkey: 'Space',
      callback: () => setSpacePan(false),
      options: { eventType: 'keyup' },
    },
    {
      hotkey: 'Mod+Shift+N',
      callback: () => addLayer(),
      options: prevent,
    },
    {
      hotkey: 'Mod+Shift+]',
      callback: () => {
        if (!activeLayerLocked) rotateActiveLayer(90)
      },
      options: { ...prevent, enabled: !activeLayerLocked },
    },
    {
      hotkey: 'Mod+Shift+[',
      callback: () => {
        if (!activeLayerLocked) rotateActiveLayer(-90)
      },
      options: { ...prevent, enabled: !activeLayerLocked },
    },
    {
      hotkey: 'Mod+J',
      callback: () => {
        if (activeLayerId) dispatch({ type: 'DUPLICATE_LAYER', id: activeLayerId })
      },
      options: { ...prevent, enabled: !!activeLayerId },
    },
    { hotkey: 'Mod+Z', callback: () => dispatch({ type: 'UNDO' }), options: prevent },
    { hotkey: 'Mod+Y', callback: () => dispatch({ type: 'REDO' }), options: prevent },
    { hotkey: 'Mod+Shift+Z', callback: () => dispatch({ type: 'REDO' }), options: prevent },
    { hotkey: 'Mod+D', callback: onDeselect, options: prevent },
    { hotkey: 'Mod+A', callback: onSelectAll, options: prevent },
    { hotkey: 'Mod+C', callback: onCopy, options: prevent },
    {
      hotkey: 'Mod+X',
      callback: () => {
        onCopy()
        onClear()
      },
      options: prevent,
    },
    { hotkey: 'Mod+V', callback: onPaste, options: prevent },
    { hotkey: 'Delete', callback: onClear, options: prevent },
    { hotkey: 'Backspace', callback: onClear, options: prevent },
    { hotkey: 'X', callback: swapColors },
    { hotkey: 'D', callback: resetColors },
    {
      hotkey: '[',
      callback: () => setBrushSize(Math.max(1, brushSize - 2)),
    },
    {
      hotkey: ']',
      callback: () => setBrushSize(Math.min(500, brushSize + 2)),
    },
    { hotkey: 'Shift+G', callback: () => setTool('gradient') },
    { hotkey: 'Shift+L', callback: () => setTool('polygon-lasso') },
    { hotkey: 'Shift+N', callback: () => setTool('shape-arrow') },
    { hotkey: 'Shift+U', callback: () => setTool('shape-ellipse') },
  ]

  for (const [key, tool] of Object.entries(TOOL_KEYS)) {
    hotkeys.push({
      hotkey: key,
      callback: () => setTool(tool),
    })
  }

  return hotkeys
}
