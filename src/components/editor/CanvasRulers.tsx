import { useMemo } from "react";
import type { ViewportLayout } from "@/lib/canvas/viewport";

export const RULER_SIZE = 24;

function pickRulerStep(baseStep: number, viewScale: number): number {
	const minScreenGap = 48;
	let step = Math.max(1, baseStep);
	while (step * viewScale < minScreenGap) step *= 2;
	return step;
}

type CanvasRulersProps = {
	scrollX: number;
	scrollY: number;
	viewportW: number;
	viewportH: number;
	layout: ViewportLayout;
	docWidth: number;
	docHeight: number;
	gridSize: number;
};

export function CanvasRulers({
	scrollX,
	scrollY,
	viewportW,
	viewportH,
	layout,
	docWidth,
	docHeight,
	gridSize,
}: CanvasRulersProps) {
	const { scale: viewScale, offsetX, offsetY } = layout;
	const step = pickRulerStep(gridSize, viewScale);
	const labelEvery = step * 2;

	const hMarks = useMemo(() => {
		const marks: React.ReactNode[] = [];
		for (let docX = 0; docX <= docWidth; docX += step) {
			const sx = docX * viewScale + offsetX - scrollX - RULER_SIZE;
			if (sx < -2 || sx > viewportW - RULER_SIZE + 2) continue;
			const major = docX % labelEvery === 0;
			marks.push(
				<g key={`hx-${docX}`}>
					<line
						x1={sx}
						y1={major ? 10 : 16}
						x2={sx}
						y2={RULER_SIZE - 1}
						stroke={major ? "#71717a" : "#52525b"}
						strokeWidth={1}
					/>
					{major ? (
						<text x={sx + 3} y={11} fill="#a1a1aa" fontSize={9} fontFamily="system-ui,sans-serif">
							{docX}
						</text>
					) : null}
				</g>,
			);
		}
		return marks;
	}, [
		docWidth,
		step,
		labelEvery,
		viewScale,
		offsetX,
		scrollX,
		viewportW,
	]);

	const vMarks = useMemo(() => {
		const marks: React.ReactNode[] = [];
		for (let docY = 0; docY <= docHeight; docY += step) {
			const sy = docY * viewScale + offsetY - scrollY - RULER_SIZE;
			if (sy < -2 || sy > viewportH - RULER_SIZE + 2) continue;
			const major = docY % labelEvery === 0;
			marks.push(
				<g key={`vy-${docY}`}>
					<line
						x1={major ? 10 : 16}
						y1={sy}
						x2={RULER_SIZE - 1}
						y2={sy}
						stroke={major ? "#71717a" : "#52525b"}
						strokeWidth={1}
					/>
					{major ? (
						<text
							x={3}
							y={sy + 3}
							fill="#a1a1aa"
							fontSize={9}
							fontFamily="system-ui,sans-serif"
						>
							{docY}
						</text>
					) : null}
				</g>,
			);
		}
		return marks;
	}, [
		docHeight,
		step,
		labelEvery,
		viewScale,
		offsetY,
		scrollY,
		viewportH,
	]);

	if (viewportW < 1 || viewportH < 1) return null;

	return (
		<div className="pointer-events-none absolute inset-0 z-[8] overflow-hidden">
			<div
				className="absolute left-0 top-0 z-10 border-b border-r border-zinc-700/60 bg-[#18181b]"
				style={{ width: RULER_SIZE, height: RULER_SIZE }}
			/>
			<div
				className="absolute right-0 top-0 z-10 overflow-hidden border-b border-zinc-700/60 bg-[#18181b]"
				style={{ left: RULER_SIZE, height: RULER_SIZE }}
			>
				<svg width={viewportW - RULER_SIZE} height={RULER_SIZE}>
					{hMarks}
				</svg>
			</div>
			<div
				className="absolute bottom-0 left-0 z-10 overflow-hidden border-r border-zinc-700/60 bg-[#18181b]"
				style={{ top: RULER_SIZE, width: RULER_SIZE }}
			>
				<svg width={RULER_SIZE} height={viewportH - RULER_SIZE}>
					{vMarks}
				</svg>
			</div>
		</div>
	);
}
