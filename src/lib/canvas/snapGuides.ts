import { snapCoord } from "@/lib/canvas/snap";
import type { Layer } from "@/types/editor";

export type SnapGuide = {
	orientation: "v" | "h";
	/** Document coordinate of the guide line. */
	position: number;
};

const THRESHOLD = 6;

type Edge = { x: number; y: number; cx: number; cy: number; r: number; b: number };

function layerEdges(layer: Layer): Edge {
	const sx = layer.scaleX ?? 1;
	const sy = layer.scaleY ?? 1;
	const w = layer.canvas.width * sx;
	const h = layer.canvas.height * sy;
	const cx = layer.x + layer.canvas.width / 2;
	const cy = layer.y + layer.canvas.height / 2;
	return {
		x: cx - w / 2,
		y: cy - h / 2,
		cx,
		cy,
		r: cx + w / 2,
		b: cy + h / 2,
	};
}

/**
 * Snap a dragged layer's proposed x/y against canvas edges and other layers.
 * Returns snapped position + guide lines to draw.
 */
export function snapLayerMove(
	proposedX: number,
	proposedY: number,
	moving: Layer,
	others: Layer[],
	docWidth: number,
	docHeight: number,
	enabled: boolean,
): { x: number; y: number; guides: SnapGuide[] } {
	if (!enabled) {
		return { x: proposedX, y: proposedY, guides: [] };
	}

	const sx = moving.scaleX ?? 1;
	const sy = moving.scaleY ?? 1;
	const w = moving.canvas.width * sx;
	const h = moving.canvas.height * sy;
	const cx0 = proposedX + moving.canvas.width / 2;
	const cy0 = proposedY + moving.canvas.height / 2;

	let bestDx = 0;
	let bestDy = 0;
	let bestAbsX = THRESHOLD + 1;
	let bestAbsY = THRESHOLD + 1;
	const guides: SnapGuide[] = [];

	const targetsX = [0, docWidth / 2, docWidth];
	const targetsY = [0, docHeight / 2, docHeight];

	for (const other of others) {
		if (!other.visible || other.id === moving.id) continue;
		const e = layerEdges(other);
		targetsX.push(e.x, e.cx, e.r);
		targetsY.push(e.y, e.cy, e.b);
	}

	const movingXs = [cx0 - w / 2, cx0, cx0 + w / 2];
	const movingYs = [cy0 - h / 2, cy0, cy0 + h / 2];

	for (const mx of movingXs) {
		for (const tx of targetsX) {
			const d = tx - mx;
			const ad = Math.abs(d);
			if (ad < bestAbsX) {
				bestAbsX = ad;
				bestDx = d;
			}
		}
	}

	for (const my of movingYs) {
		for (const ty of targetsY) {
			const d = ty - my;
			const ad = Math.abs(d);
			if (ad < bestAbsY) {
				bestAbsY = ad;
				bestDy = d;
			}
		}
	}

	let x = proposedX;
	let y = proposedY;

	if (bestAbsX <= THRESHOLD) {
		x = proposedX + bestDx;
		const snappedCx = x + moving.canvas.width / 2;
		const lineX =
			targetsX.find(
				(tx) =>
					Math.abs(tx - (snappedCx - w / 2)) < 0.5 ||
					Math.abs(tx - snappedCx) < 0.5 ||
					Math.abs(tx - (snappedCx + w / 2)) < 0.5,
			) ?? snappedCx;
		guides.push({ orientation: "v", position: lineX });
	}

	if (bestAbsY <= THRESHOLD) {
		y = proposedY + bestDy;
		const snappedCy = y + moving.canvas.height / 2;
		const lineY =
			targetsY.find(
				(ty) =>
					Math.abs(ty - (snappedCy - h / 2)) < 0.5 ||
					Math.abs(ty - snappedCy) < 0.5 ||
					Math.abs(ty - (snappedCy + h / 2)) < 0.5,
			) ?? snappedCy;
		guides.push({ orientation: "h", position: lineY });
	}

	return { x, y, guides };
}

export { snapCoord };
