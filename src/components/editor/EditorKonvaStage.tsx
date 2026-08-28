import type Konva from "konva";
import { memo, useEffect, useMemo } from "react";
import { Image as KonvaImage, Layer, Rect, Stage } from "react-konva";
import { getCheckerboardCanvas } from "@/lib/cache/checkerboardCache";
import {
	getLayerPreviewCanvas,
	previewMaxEdgeForDoc,
} from "@/lib/canvas/previewCache";
import type { ViewportLayout } from "@/lib/canvas/viewport";
import type { Layer as EditorLayer } from "@/types/editor";
import { BLEND_MODE_MAP } from "@/types/editor";

function layerDisplayImage(layer: EditorLayer): HTMLCanvasElement {
	if (!layer.mask) return layer.canvas;
	const out = document.createElement("canvas");
	out.width = layer.canvas.width;
	out.height = layer.canvas.height;
	const ctx = out.getContext("2d")!;
	ctx.drawImage(layer.canvas, 0, 0);
	ctx.globalCompositeOperation = "destination-in";
	ctx.drawImage(layer.mask, 0, 0);
	return out;
}

export const EditorKonvaStage = memo(function EditorKonvaStage({
	layers,
	docWidth,
	docHeight,
	viewportW,
	viewportH,
	layout,
	renderTick,
	documentFill,
	stageRef,
	usePreview = false,
}: {
	layers: EditorLayer[];
	docWidth: number;
	docHeight: number;
	viewportW: number;
	viewportH: number;
	layout: ViewportLayout;
	renderTick: number;
	documentFill: string;
	stageRef: React.RefObject<Konva.Stage | null>;
	/** When true, draw downsampled layer bitmaps (for pan/zoom on large docs). */
	usePreview?: boolean;
}) {
	const { scale, offsetX, offsetY, canvasW, canvasH } = layout;
	const maxEdge = previewMaxEdgeForDoc(docWidth, docHeight);

	const checkerboard =
		canvasW >= 1 && canvasH >= 1 ? getCheckerboardCanvas(canvasW, canvasH) : null;

	const displayImages = useMemo(() => {
		const map = new Map<string, HTMLCanvasElement>();
		for (const layer of layers) {
			if (usePreview) {
				map.set(
					layer.id,
					getLayerPreviewCanvas(layer, maxEdge, renderTick),
				);
			} else {
				map.set(layer.id, layerDisplayImage(layer));
			}
		}
		return map;
	}, [layers, renderTick, usePreview, maxEdge]);

	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) return;
		stage.getLayers().forEach((layer) => layer.batchDraw());
	}, [renderTick, stageRef, usePreview]);

	if (viewportW < 1 || viewportH < 1) return null;

	return (
		<Stage
			ref={stageRef}
			width={canvasW}
			height={canvasH}
			className="canvas-document block"
			style={{ pointerEvents: "none" }}
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
				<Rect
					width={docWidth}
					height={docHeight}
					fill={documentFill}
					listening={false}
				/>
				{layers.map((layer) => {
					if (!layer.visible) return null;
					const w = layer.canvas.width;
					const h = layer.canvas.height;
					const rot = layer.rotation ?? 0;
					const sx = layer.scaleX ?? 1;
					const sy = layer.scaleY ?? 1;
					const image = displayImages.get(layer.id) ?? layer.canvas;
					return (
						<KonvaImage
							key={layer.id}
							image={image}
							x={layer.x + w / 2}
							y={layer.y + h / 2}
							offsetX={w / 2}
							offsetY={h / 2}
							width={w}
							height={h}
							rotation={rot}
							scaleX={sx}
							scaleY={sy}
							opacity={layer.opacity / 100}
							globalCompositeOperation={BLEND_MODE_MAP[layer.blendMode]}
							listening={false}
						/>
					);
				})}
			</Layer>
		</Stage>
	);
});
