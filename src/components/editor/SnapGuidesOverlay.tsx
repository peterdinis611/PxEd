import type { SnapGuide } from "@/lib/canvas/snapGuides";
import type { ViewportLayout } from "@/lib/canvas/viewport";

export function SnapGuidesOverlay({
	guides,
	layout,
	docWidth,
	docHeight,
}: {
	guides: SnapGuide[];
	layout: ViewportLayout;
	docWidth: number;
	docHeight: number;
}) {
	if (guides.length === 0) return null;
	const { scale, offsetX, offsetY, canvasW, canvasH } = layout;

	return (
		<svg
			className="pointer-events-none absolute left-0 top-0 z-[14]"
			width={canvasW}
			height={canvasH}
		>
			{guides.map((g, i) => {
				if (g.orientation === "v") {
					const x = g.position * scale + offsetX;
					return (
						<line
							key={`v-${i}-${g.position}`}
							x1={x}
							y1={offsetY}
							x2={x}
							y2={offsetY + docHeight * scale}
							stroke="#f472b6"
							strokeWidth={1}
							strokeDasharray="4 3"
						/>
					);
				}
				const y = g.position * scale + offsetY;
				return (
					<line
						key={`h-${i}-${g.position}`}
						x1={offsetX}
						y1={y}
						x2={offsetX + docWidth * scale}
						y2={y}
						stroke="#f472b6"
						strokeWidth={1}
						strokeDasharray="4 3"
					/>
				);
			})}
		</svg>
	);
}
