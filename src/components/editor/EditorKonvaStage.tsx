import type Konva from "konva";
import { memo, useEffect } from "react";
import { Image as KonvaImage, Layer, Rect, Stage } from "react-konva";
import { getCheckerboardCanvas } from "@/lib/cache/checkerboardCache";
import type { ViewportLayout } from "@/lib/canvas/viewport";
import type { Layer as EditorLayer } from "@/types/editor";
import { BLEND_MODE_MAP } from "@/types/editor";

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
}) {
	const { scale, offsetX, offsetY, canvasW, canvasH } = layout;

	const checkerboard =
		canvasW >= 1 && canvasH >= 1 ? getCheckerboardCanvas(canvasW, canvasH) : null;

	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) return;
		stage.getLayers().forEach((layer) => layer.batchDraw());
	}, [renderTick, stageRef]);

	if (viewportW < 1 || viewportH < 1) return null;

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
					);
				})}
			</Layer>
		</Stage>
	);
});
