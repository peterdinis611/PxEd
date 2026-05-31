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
