import type { ViewportLayout } from "@/lib/canvas/viewport";

export function BrushCursorPreview({
	docX,
	docY,
	size,
	layout,
	visible,
}: {
	docX: number;
	docY: number;
	size: number;
	layout: ViewportLayout;
	visible: boolean;
}) {
	if (!visible || size < 1) return null;
	const { scale, offsetX, offsetY } = layout;
	const r = (size / 2) * scale;
	const cx = docX * scale + offsetX;
	const cy = docY * scale + offsetY;

	return (
		<svg
			className="pointer-events-none absolute left-0 top-0 z-[16] overflow-visible"
			width={layout.canvasW}
			height={layout.canvasH}
		>
			<circle
				cx={cx}
				cy={cy}
				r={Math.max(1, r)}
				fill="none"
				stroke="rgba(255,255,255,0.85)"
				strokeWidth={1}
			/>
			<circle
				cx={cx}
				cy={cy}
				r={Math.max(1, r)}
				fill="none"
				stroke="rgba(0,0,0,0.55)"
				strokeWidth={1}
				strokeDasharray="3 2"
			/>
		</svg>
	);
}
