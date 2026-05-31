import type { Layer } from "@/types/editor";

export function normalizeAngle(degrees: number): number {
	let a = degrees % 360;
	if (a < 0) a += 360;
	return Math.round(a * 100) / 100;
}

/** Draw a layer respecting position, opacity, blend mode, and rotation. */
export function drawLayerWithTransform(
	ctx: CanvasRenderingContext2D,
	layer: Layer,
): void {
	const { canvas, x, y, rotation } = layer;
	if (!rotation) {
		ctx.drawImage(canvas, x, y);
		return;
	}
	const cx = x + canvas.width / 2;
	const cy = y + canvas.height / 2;
	ctx.translate(cx, cy);
	ctx.rotate((rotation * Math.PI) / 180);
	ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
}

/** Bake current rotation into pixel data and reset rotation to 0°. */
export function bakeLayerRotation(layer: Layer): Layer {
	const rot = layer.rotation ?? 0;
	if (rot === 0) return layer;

	const rad = (rot * Math.PI) / 180;
	const w = layer.canvas.width;
	const h = layer.canvas.height;
	const cos = Math.abs(Math.cos(rad));
	const sin = Math.abs(Math.sin(rad));
	const nw = Math.max(1, Math.ceil(w * cos + h * sin));
	const nh = Math.max(1, Math.ceil(w * sin + h * cos));

	const nc = document.createElement("canvas");
	nc.width = nw;
	nc.height = nh;
	const ctx = nc.getContext("2d")!;
	ctx.translate(nw / 2, nh / 2);
	ctx.rotate(rad);
	ctx.drawImage(layer.canvas, -w / 2, -h / 2);

	const cx = layer.x + w / 2;
	const cy = layer.y + h / 2;

	return {
		...layer,
		canvas: nc,
		x: cx - nw / 2,
		y: cy - nh / 2,
		rotation: 0,
	};
}

export function rotateLayerBy(layer: Layer, deltaDegrees: number): Layer {
	return {
		...layer,
		rotation: normalizeAngle((layer.rotation ?? 0) + deltaDegrees),
	};
}
