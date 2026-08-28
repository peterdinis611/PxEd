import type { GradientSettings } from "@/types/editor";

/** Build a canvas gradient from editor settings along a drag line. */
export function createGradientFromDrag(
	ctx: CanvasRenderingContext2D,
	settings: GradientSettings,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
): CanvasGradient {
	const stops =
		settings.stops.length >= 2
			? settings.stops
			: [
					{ offset: 0, color: "#000000" },
					{ offset: 1, color: "#ffffff" },
				];

	let g: CanvasGradient;
	if (settings.type === "radial") {
		const r = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
		g = ctx.createRadialGradient(x0, y0, 0, x0, y0, r);
	} else {
		g = ctx.createLinearGradient(x0, y0, x1, y1);
	}

	const sorted = [...stops].sort((a, b) => a.offset - b.offset);
	for (const stop of sorted) {
		const t = Math.min(1, Math.max(0, stop.offset));
		g.addColorStop(t, stop.color);
	}
	return g;
}
