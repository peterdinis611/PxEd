import { useEffect, useRef } from 'react'
import Konva from 'konva'
import {
  Circle,
  Ellipse,
  Group,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
} from 'react-konva'
import { normalizeRect } from '@/lib/canvas/selection'
import type { ShapeSettings } from '@/types/editor'
import type { ShapeDrawPreview as ShapePreview } from '@/types/shapePreview'
import type { ViewportLayout } from '@/lib/canvas/viewport'

const PREVIEW_FILL_OPACITY = 0.35
const GUIDE_STROKE = 'rgba(255, 255, 255, 0.95)'
const ACCENT_STROKE = 'rgba(96, 165, 250, 0.9)'
const TWEEN_MS = 0.07

function tweenNode(
  node: Konva.Node | null,
  attrs: Konva.NodeConfig,
  duration = TWEEN_MS,
) {
  if (!node) return
  node.to({
    ...attrs,
    duration,
    easing: Konva.Easings.EaseOut,
  })
}

function PreviewRect({
  x,
  y,
  width,
  height,
  shape,
  filled,
}: {
  x: number
  y: number
  width: number
  height: number
  shape: ShapeSettings
  filled: boolean
}) {
  const fillRef = useRef<Konva.Rect>(null)
  const strokeRef = useRef<Konva.Rect>(null)
  const guideRef = useRef<Konva.Rect>(null)

  const attrs = {
    x,
    y,
    width: Math.max(width, 0),
    height: Math.max(height, 0),
    cornerRadius: shape.cornerRadius,
  }

  useEffect(() => {
    tweenNode(fillRef.current, attrs)
    tweenNode(strokeRef.current, attrs)
    tweenNode(guideRef.current, attrs)
  }, [x, y, width, height, shape.cornerRadius])

  return (
    <>
      {filled && (
        <Rect
          ref={fillRef}
          {...attrs}
          fill={shape.fillColor}
          opacity={PREVIEW_FILL_OPACITY}
          listening={false}
        />
      )}
      <Rect
        ref={strokeRef}
        {...attrs}
        stroke={shape.strokeColor}
        strokeWidth={shape.strokeWidth}
        fill="transparent"
        lineCap={shape.lineCap}
        lineJoin={shape.lineJoin}
        shadowColor={ACCENT_STROKE}
        shadowBlur={6}
        shadowOpacity={0.5}
        listening={false}
      />
      <Rect
        ref={guideRef}
        {...attrs}
        stroke={GUIDE_STROKE}
        strokeWidth={1}
        dash={[6, 4]}
        fill="transparent"
        listening={false}
        name="shape-preview-march"
      />
    </>
  )
}

function PreviewEllipse({
  x,
  y,
  width,
  height,
  shape,
  filled,
}: {
  x: number
  y: number
  width: number
  height: number
  shape: ShapeSettings
  filled: boolean
}) {
  const w = Math.abs(width)
  const h = Math.abs(height)
  const cx = x + width / 2
  const cy = y + height / 2
  const fillRef = useRef<Konva.Ellipse>(null)
  const strokeRef = useRef<Konva.Ellipse>(null)
  const guideRef = useRef<Konva.Ellipse>(null)

  const attrs = { x: cx, y: cy, radiusX: w / 2, radiusY: h / 2 }

  useEffect(() => {
    tweenNode(fillRef.current, attrs)
    tweenNode(strokeRef.current, attrs)
    tweenNode(guideRef.current, attrs)
  }, [cx, cy, w, h])

  return (
    <>
      {filled && (
        <Ellipse
          ref={fillRef}
          {...attrs}
          fill={shape.fillColor}
          opacity={PREVIEW_FILL_OPACITY}
          listening={false}
        />
      )}
      <Ellipse
        ref={strokeRef}
        {...attrs}
        stroke={shape.strokeColor}
        strokeWidth={shape.strokeWidth}
        shadowColor={ACCENT_STROKE}
        shadowBlur={6}
        shadowOpacity={0.5}
        listening={false}
      />
      <Ellipse
        ref={guideRef}
        {...attrs}
        stroke={GUIDE_STROKE}
        strokeWidth={1}
        dash={[6, 4]}
        name="shape-preview-march"
        listening={false}
      />
    </>
  )
}

function PreviewLine({
  startX,
  startY,
  endX,
  endY,
  shape,
}: {
  startX: number
  startY: number
  endX: number
  endY: number
  shape: ShapeSettings
}) {
  const lineRef = useRef<Konva.Line>(null)
  const guideRef = useRef<Konva.Line>(null)
  const points = [startX, startY, endX, endY]

  useEffect(() => {
    tweenNode(lineRef.current, { points })
    tweenNode(guideRef.current, { points })
  }, [startX, startY, endX, endY])

  const handleR = Math.max(3, shape.strokeWidth * 0.75)

  return (
    <>
      <Line
        ref={lineRef}
        points={points}
        stroke={shape.strokeColor}
        strokeWidth={shape.strokeWidth}
        lineCap={shape.lineCap}
        lineJoin={shape.lineJoin}
        shadowColor={ACCENT_STROKE}
        shadowBlur={8}
        shadowOpacity={0.55}
        listening={false}
      />
      <Line
        ref={guideRef}
        points={points}
        stroke={GUIDE_STROKE}
        strokeWidth={1}
        dash={[5, 4]}
        name="shape-preview-march"
        listening={false}
      />
      <Circle x={startX} y={startY} radius={handleR} fill={ACCENT_STROKE} listening={false} />
      <Circle
        x={endX}
        y={endY}
        radius={handleR}
        fill={GUIDE_STROKE}
        stroke={ACCENT_STROKE}
        strokeWidth={1}
        listening={false}
      />
    </>
  )
}

function PreviewGradient({
  startX,
  startY,
  endX,
  endY,
  fg,
  bg,
}: {
  startX: number
  startY: number
  endX: number
  endY: number
  fg: string
  bg: string
}) {
  const r = normalizeRect(startX, startY, endX, endY)
  const rectRef = useRef<Konva.Rect>(null)
  const guideRef = useRef<Konva.Rect>(null)

  useEffect(() => {
    tweenNode(rectRef.current, r)
    tweenNode(guideRef.current, r)
  }, [r.x, r.y, r.width, r.height])

  return (
    <>
      <Rect
        ref={rectRef}
        x={r.x}
        y={r.y}
        width={r.width}
        height={r.height}
        fillLinearGradientStartPoint={{ x: startX - r.x, y: startY - r.y }}
        fillLinearGradientEndPoint={{ x: endX - r.x, y: endY - r.y }}
        fillLinearGradientColorStops={[0, fg, 1, bg]}
        opacity={0.85}
        shadowColor={ACCENT_STROKE}
        shadowBlur={8}
        shadowOpacity={0.4}
        listening={false}
      />
      <Rect
        ref={guideRef}
        x={r.x}
        y={r.y}
        width={r.width}
        height={r.height}
        stroke={GUIDE_STROKE}
        strokeWidth={1}
        dash={[6, 4]}
        fill="transparent"
        name="shape-preview-march"
        listening={false}
      />
    </>
  )
}

function SizeLabel({
  x,
  y,
  width,
  height,
  scale,
}: {
  x: number
  y: number
  width: number
  height: number
  scale: number
}) {
  const w = Math.round(Math.abs(width))
  const h = Math.round(Math.abs(height))
  if (w < 2 && h < 2) return null

  const fontSize = Math.max(10, 11 / scale)
  const pad = 4 / scale
  const label = `${w} × ${h}`
  const labelY = y + height + pad + fontSize

  return (
    <Group listening={false}>
      <Rect
        x={x + width / 2 - (label.length * fontSize * 0.32) / 2 - pad}
        y={labelY - fontSize - pad * 0.5}
        width={label.length * fontSize * 0.32 + pad * 2}
        height={fontSize + pad}
        fill="rgba(24, 24, 27, 0.88)"
        cornerRadius={3 / scale}
        listening={false}
      />
      <Text
        x={x + width / 2}
        y={labelY - fontSize * 0.15}
        text={label}
        fontSize={fontSize}
        fill="#e4e4e7"
        fontFamily="ui-monospace, monospace"
        align="center"
        offsetX={(label.length * fontSize * 0.32) / 2}
        listening={false}
      />
    </Group>
  )
}

function PreviewBody({
  preview,
  shape,
  foregroundColor,
  backgroundColor,
  scale,
}: {
  preview: ShapePreview
  shape: ShapeSettings
  foregroundColor: string
  backgroundColor: string
  scale: number
}) {
  const groupRef = useRef<Konva.Group>(null)
  const { startX, startY, endX, endY, kind } = preview
  const r = normalizeRect(startX, startY, endX, endY)

  useEffect(() => {
    const g = groupRef.current
    if (!g) return
    g.opacity(0)
    g.to({ opacity: 1, duration: 0.12, easing: Konva.Easings.EaseOut })
  }, [])

  return (
    <Group ref={groupRef} opacity={1} listening={false}>
      {kind === 'shape-rect' && (
        <PreviewRect
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          shape={shape}
          filled={shape.filled}
        />
      )}
      {kind === 'shape-ellipse' && (
        <PreviewEllipse
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          shape={shape}
          filled={shape.filled}
        />
      )}
      {(kind === 'shape-line' || kind === 'shape-arrow') && (
        <PreviewLine
          startX={startX}
          startY={startY}
          endX={endX}
          endY={endY}
          shape={shape}
        />
      )}
      {kind === 'gradient' && (
        <PreviewGradient
          startX={startX}
          startY={startY}
          endX={endX}
          endY={endY}
          fg={foregroundColor}
          bg={backgroundColor}
        />
      )}
      {kind !== 'shape-line' && kind !== 'shape-arrow' && (
        <SizeLabel
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          scale={scale}
        />
      )}
    </Group>
  )
}

function CommitFlashShape({
  preview,
  shape,
  foregroundColor,
  backgroundColor,
  onDone,
}: {
  preview: ShapePreview
  shape: ShapeSettings
  foregroundColor: string
  backgroundColor: string
  onDone: () => void
}) {
  const groupRef = useRef<Konva.Group>(null)

  useEffect(() => {
    const g = groupRef.current
    if (!g) return
    g.opacity(0.75)
    g.scale({ x: 0.96, y: 0.96 })
    g.to({
      opacity: 0,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 0.38,
      easing: Konva.Easings.EaseOut,
      onFinish: onDone,
    })
  }, [onDone])

  return (
    <Group ref={groupRef} listening={false}>
      <PreviewBody
        preview={preview}
        shape={shape}
        foregroundColor={foregroundColor}
        backgroundColor={backgroundColor}
        scale={1}
      />
    </Group>
  )
}

function MarchingAntsLayer({ layerRef }: { layerRef: React.RefObject<Konva.Layer | null> }) {
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    const anim = new Konva.Animation((frame) => {
      const offset = -((frame?.time ?? 0) / 35) % 20
      layer.find('.shape-preview-march').forEach((node) => {
        node.setAttr('dashOffset', offset)
      })
    }, layer)

    anim.start()
    return () => {
      anim.stop()
    }
  }, [layerRef])

  return null
}

export function ShapeDrawPreviewOverlay({
  preview,
  commitFlash,
  layout,
  shape,
  foregroundColor,
  backgroundColor,
  onCommitFlashDone,
}: {
  preview: ShapePreview | null
  commitFlash: ShapePreview | null
  layout: ViewportLayout
  shape: ShapeSettings
  foregroundColor: string
  backgroundColor: string
  onCommitFlashDone: () => void
}) {
  const { scale, offsetX, offsetY, canvasW, canvasH } = layout
  const overlayLayerRef = useRef<Konva.Layer>(null)

  if (!preview && !commitFlash) return null
  if (canvasW < 1 || canvasH < 1) return null

  return (
    <Stage
      width={canvasW}
      height={canvasH}
      listening={false}
      className="pointer-events-none absolute left-0 top-0 z-10"
    >
      <Layer
        ref={overlayLayerRef}
        x={offsetX}
        y={offsetY}
        scaleX={scale}
        scaleY={scale}
        listening={false}
      >
        <MarchingAntsLayer layerRef={overlayLayerRef} />
        {preview && (
          <PreviewBody
            key={`${preview.kind}-${preview.startX}-${preview.startY}`}
            preview={preview}
            shape={shape}
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            scale={scale}
          />
        )}
        {commitFlash && (
          <CommitFlashShape
            preview={commitFlash}
            shape={shape}
            foregroundColor={foregroundColor}
            backgroundColor={backgroundColor}
            onDone={onCommitFlashDone}
          />
        )}
      </Layer>
    </Stage>
  )
}
