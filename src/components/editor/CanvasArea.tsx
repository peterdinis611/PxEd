import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { screenToDoc } from '@/lib/canvas/composite'
import { computeFitViewport, type ViewportLayout } from '@/lib/canvas/viewport'
import { EditorKonvaStage } from '@/components/editor/EditorKonvaStage'
import type Konva from 'konva'
import { floodFill, magicWandSelect } from '@/lib/canvas/floodFill'
import { normalizeRect } from '@/lib/canvas/selection'
import { snapPoint } from '@/lib/canvas/snap'
import { createLayer, renderTextLayer } from '@/lib/canvas/layers'
import { drawArrow } from '@/lib/canvas/shapes'
import { ShapeDrawPreviewOverlay } from '@/components/editor/ShapeDrawPreview'
import { useEditor } from '@/context/EditorContext'
import type { Selection } from '@/types/editor'
import type { ShapeDrawPreview } from '@/types/shapePreview'

const CURSORS: Record<string, string> = {
  move: 'move',
  hand: 'grab',
  brush: 'crosshair',
  pencil: 'crosshair',
  eraser: 'crosshair',
  fill: 'crosshair',
  eyedropper: 'crosshair',
  text: 'text',
  zoom: 'zoom-in',
  crop: 'crosshair',
  gradient: 'crosshair',
  'marquee-rect': 'crosshair',
  'marquee-ellipse': 'crosshair',
  lasso: 'crosshair',
  'magic-wand': 'crosshair',
  'shape-rect': 'crosshair',
  'shape-ellipse': 'crosshair',
  'shape-line': 'crosshair',
  'shape-arrow': 'crosshair',
  'polygon-lasso': 'crosshair',
}

export function CanvasArea({
  spacePan,
  onCursorMove,
}: {
  spacePan: boolean
  onCursorMove: (x: number, y: number, rgba: string) => void
}) {
  const { state, dispatch, activeLayer, commitHistory, updateActiveLayerCanvas } =
    useEditor()
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [layout, setLayout] = useState<ViewportLayout>({
    scale: 1,
    drawW: 800,
    drawH: 600,
    offsetX: 0,
    offsetY: 0,
    canvasW: 800,
    canvasH: 600,
  })
  const layoutRef = useRef(layout)
  layoutRef.current = layout
  const dragRef = useRef<{
    type: string
    startX: number
    startY: number
    lastX: number
    lastY: number
    points?: { x: number; y: number }[]
    panStart?: { panX: number; panY: number }
    layerOffset?: { x: number; y: number }
  } | null>(null)

  const [previewSel, setPreviewSel] = useState<Selection | null>(null)
  const [shapePreview, setShapePreview] = useState<ShapeDrawPreview | null>(null)
  const [shapeCommitFlash, setShapeCommitFlash] = useState<ShapeDrawPreview | null>(
    null,
  )
  const [zoomHint, setZoomHint] = useState<number | null>(null)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const zoomHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const polygonRef = useRef<{ points: { x: number; y: number }[] } | null>(null)

  const showZoomHint = useCallback((zoom: number) => {
    setZoomHint(zoom)
    if (zoomHintTimer.current) clearTimeout(zoomHintTimer.current)
    zoomHintTimer.current = setTimeout(() => setZoomHint(null), 1200)
  }, [])

  const updateViewportSize = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setViewport({ w: el.clientWidth, h: el.clientHeight })
  }, [])

  const fitToViewport = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setViewport({ w: el.clientWidth, h: el.clientHeight })
    dispatch({ type: 'SET_VIEWPORT', ...computeFitViewport() })
  }, [dispatch])

  useLayoutEffect(() => {
    fitToViewport()
  }, [fitToViewport, state.fitRequest])

  useEffect(() => {
    if (state.tool !== 'polygon-lasso') {
      polygonRef.current = null
    }
  }, [state.tool])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && polygonRef.current) {
        polygonRef.current = null
        setPreviewSel(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    updateViewportSize()
    const ro = new ResizeObserver(updateViewportSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [updateViewportSize])

  const getDocPoint = useCallback((e: React.MouseEvent | MouseEvent) => {
    const el = stageRef.current?.container() ?? containerRef.current
    const rect = el?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return screenToDoc(e.clientX, e.clientY, rect, layoutRef.current)
  }, [])

  const docPointFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const p = getDocPoint(e)
      return snapPoint(p.x, p.y, state.gridSize, state.snapToGrid)
    },
    [getDocPoint, state.gridSize, state.snapToGrid],
  )

  const stateRef = useRef(state)
  stateRef.current = state

  const handleLayout = useCallback((next: ViewportLayout) => {
    setLayout(next)
  }, [])

  const sampleColor = (x: number, y: number) => {
    const layer = activeLayer
    if (!layer) return
    const ctx = layer.canvas.getContext('2d')!
    const r = Math.floor(state.eyedropperSample / 2)
    let tr = 0,
      tg = 0,
      tb = 0,
      n = 0
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const px = Math.floor(x) + dx
        const py = Math.floor(y) + dy
        if (px < 0 || py < 0 || px >= layer.canvas.width || py >= layer.canvas.height)
          continue
        const d = ctx.getImageData(px, py, 1, 1).data
        tr += d[0]!
        tg += d[1]!
        tb += d[2]!
        n++
      }
    }
    if (!n) return
    const hex = `#${[tr / n, tg / n, tb / n].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
    dispatch({ type: 'SET_COLORS', fg: hex })
    dispatch({ type: 'ADD_RECENT_COLOR', color: hex })
  }

  const setupBrush = (ctx: CanvasRenderingContext2D, eraser = false) => {
    const { brush, foregroundColor } = state
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = brush.size
    ctx.globalAlpha = (brush.opacity / 100) * (brush.flow / 100)
    if (eraser) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = brush.blendMode
      ctx.strokeStyle = foregroundColor
    }
  }

  const drawStroke = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    eraser = false,
  ) => {
    setupBrush(ctx, eraser)
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  const startPan = (e: React.MouseEvent) => {
      e.preventDefault()
      const origin = { panX: state.panX, panY: state.panY }
      dragRef.current = {
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        panStart: origin,
      }
      const onPanMove = (ev: PointerEvent) => {
        const d = dragRef.current
        if (!d || d.type !== 'pan' || !d.panStart) return
        dispatch({
          type: 'SET_PAN',
          panX: d.panStart.panX + (ev.clientX - d.startX),
          panY: d.panStart.panY + (ev.clientY - d.startY),
        })
      }
      const onPanUp = () => {
        if (dragRef.current?.type === 'pan') dragRef.current = null
        window.removeEventListener('pointermove', onPanMove)
        window.removeEventListener('pointerup', onPanUp)
      }
      window.addEventListener('pointermove', onPanMove)
      window.addEventListener('pointerup', onPanUp)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || ((spacePan || state.tool === 'hand') && e.button === 0)) {
      e.preventDefault()
      startPan(e)
      return
    }
    if (e.button !== 0) return

    const { x, y } = docPointFromEvent(e)
    const tool = state.tool
    const layer = activeLayer

    if (tool === 'polygon-lasso') {
      const closeRadius = 10 / layoutRef.current.scale
      const existing = polygonRef.current
      if (existing && existing.points.length >= 3) {
        const first = existing.points[0]!
        if (Math.hypot(x - first.x, y - first.y) < closeRadius) {
          dispatch({
            type: 'SET_SELECTION',
            selection: { type: 'lasso', points: existing.points },
          })
          polygonRef.current = null
          setPreviewSel(null)
          return
        }
      }
      const points = existing ? [...existing.points, { x, y }] : [{ x, y }]
      polygonRef.current = { points }
      setPreviewSel({ type: 'lasso', points })
      return
    }

    if (tool === 'zoom') {
      const delta = e.altKey ? -25 : 25
      const next = state.zoom + delta
      dispatch({ type: 'SET_ZOOM', zoom: next })
      showZoomHint(next)
      return
    }

    if (tool === 'eyedropper') {
      sampleColor(x, y)
      return
    }

    if (!layer || layer.locked) return

    if (tool === 'magic-wand') {
      const ctx = layer.canvas.getContext('2d')!
      const bounds = magicWandSelect(ctx, x, y, state.magicWandTolerance)
      if (bounds) {
        dispatch({
          type: 'SET_SELECTION',
          selection: { type: 'rect', ...bounds },
        })
      }
      return
    }

    if (tool === 'fill') {
      updateActiveLayerCanvas((ctx) => {
        ctx.save()
        ctx.globalAlpha = state.fillOpacity / 100
        floodFill(ctx, x, y, state.foregroundColor, state.fillTolerance)
        ctx.restore()
      })
      commitHistory('Fill')
      return
    }

    if (tool === 'text') {
      const text = prompt('Enter text:', layer.textData?.text ?? '')
      if (text === null) return
      const textData = {
        text,
        font: state.textFont,
        size: state.textSize,
        color: state.foregroundColor,
        bold: state.textBold,
        italic: state.textItalic,
        align: state.textAlign,
        x: Math.floor(x),
        y: Math.floor(y),
      }
      if (layer.type !== 'text') {
        const newLayer = createLayer(
          state.canvasWidth,
          state.canvasHeight,
          'Text',
          { type: 'text', textData },
        )
        renderTextLayer(newLayer)
        dispatch({
          type: 'SET_LAYERS',
          layers: [...state.layers, newLayer],
        })
        dispatch({ type: 'SET_ACTIVE_LAYER', id: newLayer.id })
      } else {
        dispatch({
          type: 'UPDATE_LAYER',
          id: layer.id,
          patch: { textData, type: 'text' },
        })
        renderTextLayer({ ...layer, textData, type: 'text' })
      }
      commitHistory('Text')
      return
    }

    dragRef.current = {
      type: tool,
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
      points: tool === 'lasso' ? [{ x, y }] : undefined,
      layerOffset:
        tool === 'move' ? { x: layer.x, y: layer.y } : undefined,
    }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    const raw = getDocPoint(e)
    const { x, y } = snapPoint(raw.x, raw.y, state.gridSize, state.snapToGrid)
    onCursorMove(raw.x, raw.y, sampleRgba(raw.x, raw.y))

    const drag = dragRef.current
    if (!drag) {
      if (state.tool === 'polygon-lasso' && polygonRef.current) {
        const pts = polygonRef.current.points
        setPreviewSel({ type: 'lasso', points: [...pts, { x, y }] })
      }
      return
    }
    if (drag.type === 'pan') return

    const tool = drag.type

    if (tool === 'move' && activeLayer && drag.layerOffset) {
      dispatch({
        type: 'UPDATE_LAYER',
        id: activeLayer.id,
        patch: {
          x: drag.layerOffset.x + (x - drag.startX),
          y: drag.layerOffset.y + (y - drag.startY),
        },
      })
      return
    }

    if (
      tool === 'marquee-rect' ||
      tool === 'marquee-ellipse' ||
      tool === 'crop'
    ) {
      const rect = normalizeRect(drag.startX, drag.startY, x, y)
      if (tool === 'crop') {
        setPreviewSel({ type: 'rect', ...rect })
      } else {
        setPreviewSel(
          tool === 'marquee-ellipse'
            ? { type: 'ellipse', ...rect }
            : { type: 'rect', ...rect },
        )
      }
      return
    }

    if (tool === 'lasso' && drag.points) {
      drag.points.push({ x, y })
      setPreviewSel({ type: 'lasso', points: [...drag.points] })
      return
    }

    if ((tool === 'brush' || tool === 'pencil' || tool === 'eraser') && activeLayer) {
      const ctx = activeLayer.canvas.getContext('2d')!
      drawStroke(ctx, drag.lastX, drag.lastY, x, y, tool === 'eraser')
      drag.lastX = x
      drag.lastY = y
      dispatch({ type: 'BUMP_RENDER' })
      return
    }

    if (
      (tool === 'shape-rect' ||
        tool === 'shape-ellipse' ||
        tool === 'shape-line' ||
        tool === 'shape-arrow' ||
        tool === 'gradient') &&
      activeLayer
    ) {
      drag.lastX = x
      drag.lastY = y
      setShapePreview({
        kind: tool as ShapeDrawPreview['kind'],
        startX: drag.startX,
        startY: drag.startY,
        endX: x,
        endY: y,
      })
      return
    }
  }

  const onMouseUp = (e?: React.MouseEvent) => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null

    const layer = activeLayer
    let endX = drag.lastX
    let endY = drag.lastY
    if (e) {
      const p = docPointFromEvent(e)
      endX = p.x
      endY = p.y
    }

    if (
      (drag.type === 'marquee-rect' || drag.type === 'marquee-ellipse') &&
      previewSel
    ) {
      dispatch({ type: 'SET_SELECTION', selection: previewSel })
      setPreviewSel(null)
      return
    }

    if (drag.type === 'lasso' && drag.points && drag.points.length > 2) {
      dispatch({
        type: 'SET_SELECTION',
        selection: { type: 'lasso', points: drag.points },
      })
      setPreviewSel(null)
      return
    }

    if (drag.type === 'crop' && previewSel && previewSel.type === 'rect') {
      const { x: cx, y: cy, width, height } = previewSel
      if (width > 1 && height > 1) {
        const nw = Math.round(width)
        const nh = Math.round(height)
        const layers = state.layers.map((l) => {
          const src = l.canvas.getContext('2d')!
          const img = src.getImageData(
            Math.max(0, Math.floor(cx)),
            Math.max(0, Math.floor(cy)),
            nw,
            nh,
          )
          const nc = document.createElement('canvas')
          nc.width = nw
          nc.height = nh
          nc.getContext('2d')!.putImageData(img, 0, 0)
          return { ...l, canvas: nc, x: 0, y: 0 }
        })
        dispatch({ type: 'SET_LAYERS', layers })
        dispatch({ type: 'SET_CANVAS_SIZE', width: nw, height: nh })
        dispatch({ type: 'SET_SELECTION', selection: null })
        commitHistory('Crop')
      }
      setPreviewSel(null)
      return
    }

    if (layer && !layer.locked) {
      const ctx = layer.canvas.getContext('2d')!
      const { shape, foregroundColor, backgroundColor } = state

      const shapeTools = new Set([
        'gradient',
        'shape-rect',
        'shape-ellipse',
        'shape-line',
        'shape-arrow',
      ])

      if (drag.type === 'gradient') {
        const g = ctx.createLinearGradient(drag.startX, drag.startY, endX, endY)
        g.addColorStop(0, foregroundColor)
        g.addColorStop(1, backgroundColor)
        ctx.fillStyle = g
        const r = normalizeRect(drag.startX, drag.startY, endX, endY)
        if (r.width > 0 || r.height > 0) {
          ctx.fillRect(r.x, r.y, r.width, r.height)
        }
        commitHistory('Gradient')
      }

      if (drag.type === 'shape-rect') {
        const r = normalizeRect(drag.startX, drag.startY, endX, endY)
        ctx.lineCap = shape.lineCap
        ctx.lineJoin = shape.lineJoin
        if (shape.filled) {
          ctx.fillStyle = shape.fillColor
          if (shape.cornerRadius > 0) {
            ctx.beginPath()
            ctx.roundRect(r.x, r.y, r.width, r.height, shape.cornerRadius)
            ctx.fill()
          } else {
            ctx.fillRect(r.x, r.y, r.width, r.height)
          }
        }
        ctx.strokeStyle = shape.strokeColor
        ctx.lineWidth = shape.strokeWidth
        if (shape.cornerRadius > 0) {
          ctx.beginPath()
          ctx.roundRect(r.x, r.y, r.width, r.height, shape.cornerRadius)
          ctx.stroke()
        } else {
          ctx.strokeRect(r.x, r.y, r.width, r.height)
        }
        commitHistory('Rectangle')
      }

      if (drag.type === 'shape-ellipse') {
        const r = normalizeRect(drag.startX, drag.startY, endX, endY)
        ctx.beginPath()
        ctx.ellipse(
          r.x + r.width / 2,
          r.y + r.height / 2,
          Math.abs(r.width / 2),
          Math.abs(r.height / 2),
          0,
          0,
          Math.PI * 2,
        )
        if (shape.filled) {
          ctx.fillStyle = shape.fillColor
          ctx.fill()
        }
        ctx.strokeStyle = shape.strokeColor
        ctx.lineWidth = shape.strokeWidth
        ctx.stroke()
        commitHistory('Ellipse')
      }

      if (drag.type === 'shape-line') {
        ctx.beginPath()
        ctx.moveTo(drag.startX, drag.startY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = shape.strokeColor
        ctx.lineWidth = shape.strokeWidth
        ctx.lineCap = shape.lineCap
        ctx.lineJoin = shape.lineJoin
        ctx.stroke()
        commitHistory('Line')
      }

      if (drag.type === 'shape-arrow') {
        ctx.strokeStyle = shape.strokeColor
        ctx.fillStyle = shape.strokeColor
        ctx.lineWidth = shape.strokeWidth
        drawArrow(
          ctx,
          drag.startX,
          drag.startY,
          endX,
          endY,
          shape.strokeWidth,
          shape.lineCap,
        )
        commitHistory('Arrow')
      }

      if (shapeTools.has(drag.type)) {
        const r = normalizeRect(drag.startX, drag.startY, endX, endY)
        const lineLen = Math.hypot(endX - drag.startX, endY - drag.startY)
        const hasSize =
          drag.type === 'shape-line' || drag.type === 'shape-arrow'
            ? lineLen > 1
            : r.width > 1 || r.height > 1
        if (hasSize) {
          setShapeCommitFlash({
            kind: drag.type as ShapeDrawPreview['kind'],
            startX: drag.startX,
            startY: drag.startY,
            endX,
            endY,
          })
        }
        setShapePreview(null)
        dispatch({ type: 'BUMP_RENDER' })
      }

      if (
        drag.type === 'brush' ||
        drag.type === 'pencil' ||
        drag.type === 'eraser'
      ) {
        commitHistory(
          drag.type === 'eraser' ? 'Eraser' : drag.type === 'pencil' ? 'Pencil' : 'Brush',
        )
      }
    }

    setPreviewSel(null)
    setShapePreview(null)
  }

  const sampleRgba = (x: number, y: number): string => {
    const layer = activeLayer
    if (!layer) return '—'
    const px = Math.floor(x)
    const py = Math.floor(y)
    if (px < 0 || py < 0 || px >= layer.canvas.width || py >= layer.canvas.height)
      return '—'
    const d = layer.canvas.getContext('2d')!.getImageData(px, py, 1, 1).data
    return `rgba(${d[0]}, ${d[1]}, ${d[2]}, ${(d[3]! / 255).toFixed(2)})`
  }

  const sel = previewSel ?? state.selection
  const { scale: viewScale, offsetX, offsetY, canvasW, canvasH } = layout
  const fillsPanel =
    canvasW <= (viewport.w || canvasW) + 1 && canvasH <= (viewport.h || canvasH) + 1

  const renderSelectionOverlay = () => {
    if (!sel) return null
    if (sel.type === 'lasso' && sel.points.length > 1) {
      const d = sel.points
        .map(
          (p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x * viewScale + offsetX} ${p.y * viewScale + offsetY}`,
        )
        .join(' ')
      return (
        <path
          d={`${d} Z`}
          fill="none"
          stroke="white"
          strokeWidth={1}
          strokeDasharray="4 4"
          className="marching-ants"
        />
      )
    }
    const b = sel.type === 'rect' || sel.type === 'ellipse' ? sel : null
    if (!b) return null
    const rx = b.x * viewScale + offsetX
    const ry = b.y * viewScale + offsetY
    const rw = b.width * viewScale
    const rh = b.height * viewScale
    if (sel.type === 'ellipse') {
      return (
        <ellipse
          cx={rx + rw / 2}
          cy={ry + rh / 2}
          rx={rw / 2}
          ry={rh / 2}
          fill="none"
          stroke="white"
          strokeWidth={1}
          strokeDasharray="4 4"
          className="marching-ants"
        />
      )
    }
    return (
      <rect
        x={rx}
        y={ry}
        width={rw}
        height={rh}
        fill="none"
        stroke="white"
        strokeWidth={1}
        strokeDasharray="4 4"
        className="marching-ants"
      />
    )
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const s = stateRef.current
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? -10 : 10
        const next = s.zoom + delta
        dispatch({ type: 'SET_ZOOM', zoom: next })
        showZoomHint(next)
      } else {
        dispatch({
          type: 'SET_PAN',
          panX: s.panX - e.deltaX,
          panY: s.panY - e.deltaY,
        })
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (zoomHintTimer.current) clearTimeout(zoomHintTimer.current)
    }
  }, [dispatch, showZoomHint])

  const cursor = spacePan
    ? 'grabbing'
    : state.tool === 'hand'
      ? 'grab'
      : (CURSORS[state.tool] ?? 'default')
  return (
    <div
      ref={containerRef}
      className="canvas-workspace smooth-scroll absolute inset-0 size-full overflow-auto"
      style={{ cursor }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={(e) => onMouseUp(e)}
      onMouseLeave={(e) => onMouseUp(e)}
    >
      <div
        className="relative min-h-full min-w-full"
        style={{
          width: Math.max(viewport.w, canvasW),
          height: Math.max(viewport.h, canvasH),
        }}
      >
        {state.showGrid && (
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'linear-gradient(#555 1px, transparent 1px), linear-gradient(90deg, #555 1px, transparent 1px)',
              backgroundSize: `${state.gridSize * viewScale}px ${state.gridSize * viewScale}px`,
              backgroundPosition: `${offsetX}px ${offsetY}px`,
            }}
          />
        )}

        <div
          className="canvas-document block"
          style={{
            width: fillsPanel ? '100%' : canvasW,
            height: fillsPanel ? '100%' : canvasH,
            minWidth: viewport.w || undefined,
            minHeight: viewport.h || undefined,
          }}
        >
          <EditorKonvaStage
            stageRef={stageRef}
            layers={state.layers}
            docWidth={state.canvasWidth}
            docHeight={state.canvasHeight}
            viewportW={viewport.w}
            viewportH={viewport.h}
            zoom={state.zoom}
            panX={state.panX}
            panY={state.panY}
            renderTick={state.renderTick}
            onLayout={handleLayout}
          />
        </div>

        <ShapeDrawPreviewOverlay
          preview={shapePreview}
          commitFlash={shapeCommitFlash}
          layout={layout}
          shape={state.shape}
          foregroundColor={state.foregroundColor}
          backgroundColor={state.backgroundColor}
          onCommitFlashDone={() => setShapeCommitFlash(null)}
        />

        <svg
          className="pointer-events-none absolute left-0 top-0 z-[5]"
          width={fillsPanel ? viewport.w : canvasW}
          height={fillsPanel ? viewport.h : canvasH}
        >
          {renderSelectionOverlay()}
        </svg>
      </div>

      <AnimatePresence>
        {zoomHint !== null && (
          <motion.div
            key={zoomHint}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="pointer-events-none fixed left-1/2 top-20 z-30 -translate-x-1/2 rounded-full border border-zinc-600/60 bg-zinc-800/90 px-4 py-1.5 text-ui-sm font-medium tabular-nums shadow-lg"
          >
            {Math.round(zoomHint)}%
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
