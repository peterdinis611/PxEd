import type { BrushSettings } from "@/types/editor";

export interface StrokeOptions {
	size: number;
	hardness: number;
	opacity: number;
	flow: number;
	spacing: number;
	color: string;
	blendMode: GlobalCompositeOperation;
	pencil?: boolean;
	eraser?: boolean;
}

export function drawBrushStroke(
	ctx: CanvasRenderingContext2D,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	options: StrokeOptions,
): void {
	const {
		size,
		hardness,
		opacity,
		flow,
		spacing,
		color,
		blendMode,
		pencil = false,
		eraser = false,
	} = options;

	const prevSmoothing = ctx.imageSmoothingEnabled;
	if (pencil) ctx.imageSmoothingEnabled = false;

	const dabSize = pencil ? Math.max(1, Math.round(size)) : size;
	const step = Math.max(1, dabSize * (spacing / 100));
	const dist = Math.hypot(x1 - x0, y1 - y0);
	const steps = Math.max(1, Math.ceil(dist / step));

	ctx.save();
	ctx.globalAlpha = (opacity / 100) * (flow / 100);
	if (eraser) {
		ctx.globalCompositeOperation = "destination-out";
	} else {
		ctx.globalCompositeOperation = blendMode;
	}

	for (let i = 0; i <= steps; i++) {
		const t = steps === 0 ? 0 : i / steps;
		const x = pencil ? Math.round(x0 + (x1 - x0) * t) : x0 + (x1 - x0) * t;
		const y = pencil ? Math.round(y0 + (y1 - y0) * t) : y0 + (y1 - y0) * t;
		paintDab(ctx, x, y, dabSize, hardness, eraser ? "rgba(0,0,0,1)" : color);
	}

	ctx.restore();
	ctx.imageSmoothingEnabled = prevSmoothing;
}

function paintDab(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	hardness: number,
	color: string,
): void {
	const radius = size / 2;
	if (radius <= 0) return;

	if (hardness >= 98) {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.fill();
		return;
	}

	const inner = Math.max(0, (hardness / 100) * radius);
	const gradient = ctx.createRadialGradient(x, y, inner, x, y, radius);
	gradient.addColorStop(0, color);
	gradient.addColorStop(1, "rgba(0,0,0,0)");
	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.fill();
}

export function brushOptionsFromState(
	brush: BrushSettings,
	foregroundColor: string,
	tool: "brush" | "pencil" | "eraser",
): StrokeOptions {
	return {
		size: tool === "pencil" ? Math.max(1, brush.size) : brush.size,
		hardness: tool === "pencil" ? 100 : brush.hardness,
		opacity: brush.opacity,
		flow: brush.flow,
		spacing: tool === "pencil" ? 100 : brush.spacing,
		color: foregroundColor,
		blendMode: brush.blendMode,
		pencil: tool === "pencil",
		eraser: tool === "eraser",
	};
}
