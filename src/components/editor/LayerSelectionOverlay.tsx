import { Circle, Layer as KonvaLayer, Line, Stage, Text } from "react-konva";
import {
	getLayerCorners,
	getRotateHandlePosition,
	isDocumentBackdropLayer,
} from "@/lib/canvas/layerBounds";
import type { ViewportLayout } from "@/lib/canvas/viewport";
import type { Layer } from "@/types/editor";

function toScreen(
	docX: number,
	docY: number,
	layout: Pick<ViewportLayout, "scale" | "offsetX" | "offsetY">,
) {
	return {
		x: docX * layout.scale + layout.offsetX,
		y: docY * layout.scale + layout.offsetY,
	};
}

export function LayerSelectionOverlay({
	layer,
	docWidth,
	docHeight,
	layout,
}: {
	layer: Layer | null;
	docWidth: number;
	docHeight: number;
	layout: ViewportLayout;
}) {
	const { canvasW, canvasH, scale } = layout;

	if (
		!layer ||
		!layer.visible ||
		isDocumentBackdropLayer(layer, docWidth, docHeight)
	) {
		return null;
	}

	const corners = getLayerCorners(layer);
	const screenPts = corners.flatMap((c) => {
		const s = toScreen(c.x, c.y, layout);
		return [s.x, s.y];
	});
	screenPts.push(screenPts[0]!, screenPts[1]!);

	const handleDoc = getRotateHandlePosition(layer, 20 / Math.max(scale, 0.01));
	const handle = toScreen(handleDoc.x, handleDoc.y, layout);
	const center = toScreen(
		layer.x + layer.canvas.width / 2,
		layer.y + layer.canvas.height / 2,
		layout,
	);

	const r = Math.max(4, 5 * scale);

	return (
		<Stage
			width={canvasW}
			height={canvasH}
			listening={false}
			className="pointer-events-none absolute left-0 top-0 z-[15]"
		>
			<KonvaLayer listening={false}>
				<Line
					points={screenPts}
					closed
					stroke="#3b82f6"
					strokeWidth={1.5}
					dash={[6, 4]}
					listening={false}
				/>
				<Line
					points={[center.x, center.y, handle.x, handle.y]}
					stroke="#60a5fa"
					strokeWidth={1}
					listening={false}
				/>
				{corners.map((c, i) => {
					const s = toScreen(c.x, c.y, layout);
					return (
						<Circle
							key={i}
							x={s.x}
							y={s.y}
							radius={r}
							fill="#1e3a5f"
							stroke="#93c5fd"
							strokeWidth={1.5}
							listening={false}
						/>
					);
				})}
				<Circle
					x={handle.x}
					y={handle.y}
					radius={r + 2}
					fill="#2563eb"
					stroke="#dbeafe"
					strokeWidth={1.5}
					listening={false}
				/>
				<Text
					x={handle.x + 8}
					y={handle.y - 6}
					text="↻"
					fontSize={12}
					fill="#93c5fd"
					listening={false}
				/>
			</KonvaLayer>
		</Stage>
	);
}
