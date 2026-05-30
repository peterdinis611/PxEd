import { useEffect } from 'react'
import { useEditor } from '@/context/EditorContext'
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

export function useKeyboardShortcuts(
  setSpacePan: (v: boolean) => void,
  onSelectAll: () => void,
  onDeselect: () => void,
  onCopy: () => void,
  onPaste: () => void,
  onClear: () => void,
) {
  const { state, dispatch, addLayer } = useEditor()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
        return

      const mod = e.ctrlKey || e.metaKey

      if (e.code === 'Space' && !mod) {
        e.preventDefault()
        setSpacePan(true)
        return
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        addLayer()
        return
      }
      if (mod && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        if (state.activeLayerId) {
          dispatch({ type: 'DUPLICATE_LAYER', id: state.activeLayerId })
        }
        return
      }
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: 'UNDO' })
        return
      }
      if ((mod && e.key === 'y') || (mod && e.shiftKey && e.key === 'z')) {
        e.preventDefault()
        dispatch({ type: 'REDO' })
        return
      }
      if (mod && e.key === 'd') {
        e.preventDefault()
        onDeselect()
        return
      }
      if (mod && e.key === 'a') {
        e.preventDefault()
        onSelectAll()
        return
      }
      if (mod && e.key === 'c') {
        e.preventDefault()
        onCopy()
        return
      }
      if (mod && e.key === 'x') {
        e.preventDefault()
        onCopy()
        onClear()
        return
      }
      if (mod && e.key === 'v') {
        e.preventDefault()
        onPaste()
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!mod) {
          e.preventDefault()
          onClear()
        }
        return
      }
      if (!mod && (e.key === 'x' || e.key === 'X')) {
        dispatch({ type: 'SWAP_COLORS' })
        return
      }
      if (e.key === 'd' || e.key === 'D') {
        if (!mod) dispatch({ type: 'RESET_COLORS' })
        return
      }
      if (e.key === '[') {
        dispatch({
          type: 'SET_BRUSH',
          brush: { size: Math.max(1, state.brush.size - 2) },
        })
        return
      }
      if (e.key === ']') {
        dispatch({
          type: 'SET_BRUSH',
          brush: { size: Math.min(500, state.brush.size + 2) },
        })
        return
      }
      if (e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        dispatch({ type: 'SET_TOOL', tool: 'gradient' })
        return
      }
      if (e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        dispatch({ type: 'SET_TOOL', tool: 'polygon-lasso' })
        return
      }
      if (e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        dispatch({ type: 'SET_TOOL', tool: 'shape-arrow' })
        return
      }
      if (e.shiftKey && (e.key === 'u' || e.key === 'U')) {
        dispatch({ type: 'SET_TOOL', tool: 'shape-ellipse' })
        return
      }

      const tool = TOOL_KEYS[e.key.toLowerCase()]
      if (tool && !mod && !e.shiftKey) {
        dispatch({ type: 'SET_TOOL', tool })
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePan(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [
    dispatch,
    addLayer,
    state.activeLayerId,
    state.brush.size,
    setSpacePan,
    onSelectAll,
    onDeselect,
    onCopy,
    onPaste,
    onClear,
  ])
}
