import { brushOptionsFromState } from "@/lib/canvas/brush";
import { drawLayerWithTransform } from "@/lib/canvas/transform";
import type { BrushSettings, Layer } from "@/types/editor";

/**
 * Clone-stamp stroke: sample from document composite at a fixed offset
 * and stamp soft circular patches onto the active layer.
 * Coordinates are document-space; painting is converted to layer-local.
 */
export function drawCloneStampStroke(
	layer: Layer,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	sourceDoc: { x: number; y: number },
	anchorDoc: { x: number; y: number },
	brush: BrushSettings,
	sourceLayers: Layer[],
	docWidth: number,
	docHeight: number,
): void {
	const opts = brushOptionsFromState(brush, "#000000", "brush");
	const spacing = Math.max(1, (opts.size * opts.spacing) / 100);
	const dist = Math.hypot(x1 - x0, y1 - y0);
	const steps = Math.max(1, Math.ceil(dist / spacing));

	const offsetX = sourceDoc.x - anchorDoc.x;
	const offsetY = sourceDoc.y - anchorDoc.y;

	const sample = document.createElement("canvas");
	sample.width = docWidth;
	sample.height = docHeight;
	const sctx = sample.getContext("2d")!;
	for (const l of sourceLayers) {
		if (!l.visible || l.id === layer.id) continue;
		sctx.save();
		sctx.globalAlpha = l.opacity / 100;
		drawLayerWithTransform(sctx, l);
		sctx.restore();
	}
	// Also sample active layer below the stamp (current pixels)
	sctx.save();
	sctx.globalAlpha = layer.opacity / 100;
	drawLayerWithTransform(sctx, layer);
	sctx.restore();

	const ctx = layer.canvas.getContext("2d")!;
	const size = opts.size;
	const half = size / 2;

	for (let i = 0; i <= steps; i++) {
		const t = steps === 0 ? 0 : i / steps;
		const dx = x0 + (x1 - x0) * t;
		const dy = y0 + (y1 - y0) * t;
		const sx = dx + offsetX;
		const sy = dy + offsetY;
		const tx = dx - layer.x;
		const ty = dy - layer.y;

		const patch = document.createElement("canvas");
		patch.width = size;
		patch.height = size;
		const pctx = patch.getContext("2d")!;
		pctx.drawImage(sample, sx - half, sy - half, size, size, 0, 0, size, size);

		pctx.globalCompositeOperation = "destination-in";
		const g = pctx.createRadialGradient(half, half, 0, half, half, half);
		const hard = Math.max(0, Math.min(1, opts.hardness / 100));
		g.addColorStop(0, `rgba(0,0,0,${opts.opacity / 100})`);
		g.addColorStop(hard, `rgba(0,0,0,${opts.opacity / 100})`);
		g.addColorStop(1, "rgba(0,0,0,0)");
		pctx.fillStyle = g;
		pctx.beginPath();
		pctx.arc(half, half, half, 0, Math.PI * 2);
		pctx.fill();

		ctx.save();
		ctx.globalAlpha = opts.flow / 100;
		ctx.drawImage(patch, tx - half, ty - half);
		ctx.restore();
	}
}
