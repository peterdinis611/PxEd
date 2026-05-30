import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Image as KonvaImage, Layer, Rect, Stage } from 'react-konva'
import type Konva from 'konva'
import { drawCheckerboard } from '@/lib/canvas/composite'
import { getViewportLayout } from '@/lib/canvas/viewport'
import { BLEND_MODE_MAP } from '@/types/editor'
import type { Layer as EditorLayer } from '@/types/editor'

export function EditorKonvaStage({
  layers,
  docWidth,
  docHeight,
  viewportW,
  viewportH,
  zoom,
  panX,
  panY,
  renderTick,
  documentFill,
  onLayout,
  stageRef,
}: {
  layers: EditorLayer[]
  docWidth: number
  docHeight: number
  viewportW: number
  viewportH: number
  zoom: number
  panX: number
  panY: number
  renderTick: number
  documentFill: string
  onLayout: (layout: ReturnType<typeof getViewportLayout>) => void
  stageRef: React.RefObject<Konva.Stage | null>
}) {
  const [checkerboard, setCheckerboard] = useState<HTMLCanvasElement | null>(null)

  const layout = useMemo(
    () =>
      getViewportLayout(viewportW, viewportH, docWidth, docHeight, zoom, panX, panY, 0),
    [viewportW, viewportH, docWidth, docHeight, zoom, panX, panY],
  )

  const { scale, offsetX, offsetY, canvasW, canvasH } = layout

  useLayoutEffect(() => {
    onLayout(layout)
  }, [layout, onLayout])

  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = Math.max(1, canvasW)
    c.height = Math.max(1, canvasH)
    const ctx = c.getContext('2d')
    if (ctx) drawCheckerboard(ctx, c.width, c.height)
    setCheckerboard(c)
  }, [canvasW, canvasH])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    stage.getLayers().forEach((layer) => layer.batchDraw())
  }, [layers, renderTick, stageRef])

  if (viewportW < 1 || viewportH < 1) return null

  return (
    <Stage
      ref={stageRef}
      width={canvasW}
      height={canvasH}
      className="canvas-document block"
      listening={false}
    >
      {checkerboard && (
        <Layer listening={false}>
          <KonvaImage
            image={checkerboard}
            width={canvasW}
            height={canvasH}
            listening={false}
          />
        </Layer>
      )}

      <Layer
        x={offsetX}
        y={offsetY}
        scaleX={scale}
        scaleY={scale}
        listening={false}
      >
        <Rect width={docWidth} height={docHeight} fill={documentFill} listening={false} />
        {layers.map((layer) => {
          if (!layer.visible) return null
          const w = layer.canvas.width
          const h = layer.canvas.height
          const rot = layer.rotation ?? 0
          return (
            <KonvaImage
              key={layer.id}
              image={layer.canvas}
              x={layer.x + w / 2}
              y={layer.y + h / 2}
              offsetX={w / 2}
              offsetY={h / 2}
              rotation={rot}
              opacity={layer.opacity / 100}
              globalCompositeOperation={BLEND_MODE_MAP[layer.blendMode]}
              listening={false}
            />
          )
        })}
      </Layer>
    </Stage>
  )
}
