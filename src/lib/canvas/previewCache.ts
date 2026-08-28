import type { Layer } from "@/types/editor";

type PreviewEntry = { version: number; canvas: HTMLCanvasElement };

const previewCache = new WeakMap<HTMLCanvasElement, Map<number, PreviewEntry>>();

/** Downsample a canvas so the longest edge is at most `maxEdge`. */
export function downsampleCanvas(
	source: HTMLCanvasElement,
	maxEdge: number,
): HTMLCanvasElement {
	const longest = Math.max(source.width, source.height);
	if (longest <= maxEdge) return source;
	const scale = maxEdge / longest;
	const w = Math.max(1, Math.round(source.width * scale));
	const h = Math.max(1, Math.round(source.height * scale));
	const out = document.createElement("canvas");
	out.width = w;
	out.height = h;
	const ctx = out.getContext("2d")!;
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "medium";
	ctx.drawImage(source, 0, 0, w, h);
	return out;
}

export function getLayerPreviewCanvas(
	layer: Layer,
	maxEdge: number,
	version = 0,
): HTMLCanvasElement {
	const source = layer.mask
		? (() => {
				const tmp = document.createElement("canvas");
				tmp.width = layer.canvas.width;
				tmp.height = layer.canvas.height;
				const t = tmp.getContext("2d")!;
				t.drawImage(layer.canvas, 0, 0);
				t.globalCompositeOperation = "destination-in";
				t.drawImage(layer.mask, 0, 0);
				return tmp;
			})()
		: layer.canvas;

	let byEdge = previewCache.get(layer.canvas);
	if (!byEdge) {
		byEdge = new Map();
		previewCache.set(layer.canvas, byEdge);
	}
	const cached = byEdge.get(maxEdge);
	if (cached && cached.version === version) return cached.canvas;
	const preview = downsampleCanvas(source, maxEdge);
	byEdge.set(maxEdge, { version, canvas: preview });
	return preview;
}

export function invalidateLayerPreview(canvas: HTMLCanvasElement): void {
	previewCache.delete(canvas);
}

export function previewMaxEdgeForDoc(
	docWidth: number,
	docHeight: number,
): number {
	const mp = (docWidth * docHeight) / 1_000_000;
	if (mp >= 24) return 1024;
	if (mp >= 12) return 1536;
	return 2048;
}
