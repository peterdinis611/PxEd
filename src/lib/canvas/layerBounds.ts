import type { Layer } from "@/types/editor";

export function getLayerCenter(layer: Layer): { x: number; y: number } {
	return {
		x: layer.x + layer.canvas.width / 2,
		y: layer.y + layer.canvas.height / 2,
	};
}

function scaledHalf(layer: Layer) {
	return {
		hw: (layer.canvas.width * (layer.scaleX ?? 1)) / 2,
		hh: (layer.canvas.height * (layer.scaleY ?? 1)) / 2,
	};
}

/** Corners of the layer bounds in document space (rotation + scale applied). */
export function getLayerCorners(layer: Layer): { x: number; y: number }[] {
	const rot = ((layer.rotation ?? 0) * Math.PI) / 180;
	const { x: cx, y: cy } = getLayerCenter(layer);
	const { hw, hh } = scaledHalf(layer);
	const cos = Math.cos(rot);
	const sin = Math.sin(rot);
	const local = [
		{ x: -hw, y: -hh },
		{ x: hw, y: -hh },
		{ x: hw, y: hh },
		{ x: -hw, y: hh },
	];
	return local.map((p) => ({
		x: cx + p.x * cos - p.y * sin,
		y: cy + p.x * sin + p.y * cos,
	}));
}

/** Full-bleed background sheet — not rotatable as an object. */
export function isDocumentBackdropLayer(
	layer: Layer,
	docWidth: number,
	docHeight: number,
): boolean {
	return (
		layer.name === "Background" &&
		Math.abs(layer.x) < 2 &&
		Math.abs(layer.y) < 2 &&
		layer.canvas.width >= docWidth - 2 &&
		layer.canvas.height >= docHeight - 2
	);
}

export function canRotateLayer(
	layer: Layer,
	docWidth: number,
	docHeight: number,
): boolean {
	if (layer.locked) return false;
	return !isDocumentBackdropLayer(layer, docWidth, docHeight);
}

export function docToLayerLocal(
	layer: Layer,
	docX: number,
	docY: number,
): { x: number; y: number } {
	const rot = -((layer.rotation ?? 0) * Math.PI) / 180;
	const { x: cx, y: cy } = getLayerCenter(layer);
	const dx = docX - cx;
	const dy = docY - cy;
	const scaleX = layer.scaleX ?? 1;
	const scaleY = layer.scaleY ?? 1;
	return {
		x: (dx * Math.cos(rot) - dy * Math.sin(rot)) / (scaleX || 1),
		y: (dx * Math.sin(rot) + dy * Math.cos(rot)) / (scaleY || 1),
	};
}

export function pointInLayerBounds(
	layer: Layer,
	docX: number,
	docY: number,
): boolean {
	const { x: lx, y: ly } = docToLayerLocal(layer, docX, docY);
	const hw = layer.canvas.width / 2;
	const hh = layer.canvas.height / 2;
	if (lx < -hw || lx > hw || ly < -hh || ly > hh) return false;

	const px = Math.floor(lx + hw);
	const py = Math.floor(ly + hh);
	if (
		px < 0 ||
		py < 0 ||
		px >= layer.canvas.width ||
		py >= layer.canvas.height
	) {
		return false;
	}
	const a = layer.canvas.getContext("2d")!.getImageData(px, py, 1, 1).data[3]!;
	return a > 8;
}

/** Topmost content layer under a document point. */
export function findLayerAtPoint(
	layers: Layer[],
	docX: number,
	docY: number,
	docWidth: number,
	docHeight: number,
): Layer | null {
	for (let i = layers.length - 1; i >= 0; i--) {
		const layer = layers[i]!;
		if (!layer.visible || layer.locked) continue;
		if (isDocumentBackdropLayer(layer, docWidth, docHeight)) continue;
		if (pointInLayerBounds(layer, docX, docY)) return layer;
	}
	return null;
}

/** Rotate-handle anchor above the top edge midpoint (document space). */
export function getRotateHandlePosition(
	layer: Layer,
	offset = 24,
): { x: number; y: number } {
	const corners = getLayerCorners(layer);
	const topMid = {
		x: (corners[0]!.x + corners[1]!.x) / 2,
		y: (corners[0]!.y + corners[1]!.y) / 2,
	};
	const { x: cx, y: cy } = getLayerCenter(layer);
	const dx = topMid.x - cx;
	const dy = topMid.y - cy;
	const len = Math.hypot(dx, dy) || 1;
	return {
		x: topMid.x + (dx / len) * offset,
		y: topMid.y + (dy / len) * offset,
	};
}

export function isNearRotateHandle(
	layer: Layer,
	docX: number,
	docY: number,
	threshold = 14,
): boolean {
	const h = getRotateHandlePosition(layer);
	return Math.hypot(docX - h.x, docY - h.y) <= threshold;
}

/** Corner index 0=TL 1=TR 2=BR 3=BL, or null if none. */
export function findNearScaleHandle(
	layer: Layer,
	docX: number,
	docY: number,
	threshold = 12,
): number | null {
	const corners = getLayerCorners(layer);
	let best: number | null = null;
	let bestDist = threshold;
	for (let i = 0; i < corners.length; i++) {
		const c = corners[i]!;
		const d = Math.hypot(docX - c.x, docY - c.y);
		if (d <= bestDist) {
			bestDist = d;
			best = i;
		}
	}
	return best;
}
