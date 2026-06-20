import type { Selection } from "@/types/editor";

export function selectionBounds(sel: Selection | null): {
	x: number;
	y: number;
	width: number;
	height: number;
} | null {
	if (!sel) return null;
	if (sel.type === "rect" || sel.type === "ellipse") {
		return { x: sel.x, y: sel.y, width: sel.width, height: sel.height };
	}
	if (sel.type === "lasso" && sel.points.length > 0) {
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		for (const p of sel.points) {
			minX = Math.min(minX, p.x);
			minY = Math.min(minY, p.y);
			maxX = Math.max(maxX, p.x);
			maxY = Math.max(maxY, p.y);
		}
		return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
	}
	return null;
}

export function pointInSelection(
	x: number,
	y: number,
	sel: Selection,
): boolean {
	if (sel.type === "rect") {
		return (
			x >= sel.x &&
			x <= sel.x + sel.width &&
			y >= sel.y &&
			y <= sel.y + sel.height
		);
	}
	if (sel.type === "ellipse") {
		const cx = sel.x + sel.width / 2;
		const cy = sel.y + sel.height / 2;
		const rx = sel.width / 2;
		const ry = sel.height / 2;
		if (rx === 0 || ry === 0) return false;
		const dx = (x - cx) / rx;
		const dy = (y - cy) / ry;
		return dx * dx + dy * dy <= 1;
	}
	return false;
}

export function normalizeRect(
	x0: number,
	y0: number,
	x1: number,
	y1: number,
): { x: number; y: number; width: number; height: number } {
	const x = Math.min(x0, x1);
	const y = Math.min(y0, y1);
	return { x, y, width: Math.abs(x1 - x0), height: Math.abs(y1 - y0) };
}

export function constrainRectToRatio(
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	ratioW: number,
	ratioH: number,
): { x: number; y: number; width: number; height: number } {
	const ratio = ratioW / Math.max(ratioH, 0.001);
	let dx = x1 - x0;
	let dy = y1 - y0;
	let w = Math.abs(dx);
	let h = Math.abs(dy);

	if (w < 1 && h < 1) {
		return normalizeRect(x0, y0, x1, y1);
	}

	if (w / Math.max(h, 0.001) > ratio) {
		h = w / ratio;
	} else {
		w = h * ratio;
	}

	const sx = dx >= 0 ? 1 : -1;
	const sy = dy >= 0 ? 1 : -1;
	return normalizeRect(x0, y0, x0 + sx * w, y0 + sy * h);
}

export function applySelectionClip(
	ctx: CanvasRenderingContext2D,
	selection: Selection,
	canvasWidth: number,
	canvasHeight: number,
	inverted = false,
): void {
	ctx.beginPath();
	if (inverted) {
		ctx.rect(0, 0, canvasWidth, canvasHeight);
	}

	if (selection.type === "rect") {
		ctx.rect(selection.x, selection.y, selection.width, selection.height);
	} else if (selection.type === "ellipse") {
		const cx = selection.x + selection.width / 2;
		const cy = selection.y + selection.height / 2;
		ctx.ellipse(
			cx,
			cy,
			Math.abs(selection.width / 2),
			Math.abs(selection.height / 2),
			0,
			0,
			Math.PI * 2,
		);
	} else if (selection.type === "lasso" && selection.points.length > 1) {
		ctx.moveTo(selection.points[0]!.x, selection.points[0]!.y);
		for (let i = 1; i < selection.points.length; i++) {
			ctx.lineTo(selection.points[i]!.x, selection.points[i]!.y);
		}
		ctx.closePath();
	}

	ctx.clip(inverted ? "evenodd" : "nonzero");
}

export function withSelectionClip(
	ctx: CanvasRenderingContext2D,
	selection: Selection | null,
	canvasWidth: number,
	canvasHeight: number,
	inverted: boolean,
	fn: (ctx: CanvasRenderingContext2D) => void,
): void {
	if (!selection) {
		fn(ctx);
		return;
	}
	ctx.save();
	applySelectionClip(ctx, selection, canvasWidth, canvasHeight, inverted);
	fn(ctx);
	ctx.restore();
}

export function canInvertSelection(selection: Selection | null): boolean {
	return (
		selection !== null &&
		(selection.type === "rect" ||
			selection.type === "ellipse" ||
			(selection.type === "lasso" && selection.points.length > 2))
	);
}
