import type { Layer } from "@/types/editor";

export function normalizeAngle(degrees: number): number {
	let a = degrees % 360;
	if (a < 0) a += 360;
	return Math.round(a * 100) / 100;
}

function ensureMaskCanvas(layer: Layer): HTMLCanvasElement {
	if (layer.mask) return layer.mask;
	const mask = document.createElement("canvas");
	mask.width = layer.canvas.width;
	mask.height = layer.canvas.height;
	const ctx = mask.getContext("2d")!;
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, mask.width, mask.height);
	return mask;
}

/** Draw a layer respecting position, opacity, blend, rotation, scale, and mask. */
export function drawLayerWithTransform(
	ctx: CanvasRenderingContext2D,
	layer: Layer,
): void {
	const { canvas, x, y, rotation } = layer;
	const scaleX = layer.scaleX ?? 1;
	const scaleY = layer.scaleY ?? 1;
	const hasTransform = Boolean(rotation) || scaleX !== 1 || scaleY !== 1;

	const drawContent = (target: CanvasRenderingContext2D) => {
		if (layer.mask) {
			const tmp = document.createElement("canvas");
			tmp.width = canvas.width;
			tmp.height = canvas.height;
			const tctx = tmp.getContext("2d")!;
			tctx.drawImage(canvas, 0, 0);
			tctx.globalCompositeOperation = "destination-in";
			tctx.drawImage(layer.mask, 0, 0);
			target.drawImage(tmp, -canvas.width / 2, -canvas.height / 2);
		} else {
			target.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
		}
	};

	const cx = x + canvas.width / 2;
	const cy = y + canvas.height / 2;

	if (!hasTransform && !layer.mask) {
		ctx.drawImage(canvas, x, y);
		return;
	}

	ctx.translate(cx, cy);
	if (rotation) ctx.rotate((rotation * Math.PI) / 180);
	if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);
	drawContent(ctx);
}

/** Bake current rotation into pixel data and reset rotation to 0°. */
export function bakeLayerRotation(layer: Layer): Layer {
	const rot = layer.rotation ?? 0;
	const scaleX = layer.scaleX ?? 1;
	const scaleY = layer.scaleY ?? 1;
	if (rot === 0 && scaleX === 1 && scaleY === 1) return layer;

	const rad = (rot * Math.PI) / 180;
	const w = layer.canvas.width;
	const h = layer.canvas.height;
	const cos = Math.abs(Math.cos(rad));
	const sin = Math.abs(Math.sin(rad));
	const nw = Math.max(1, Math.ceil((w * Math.abs(scaleX)) * cos + (h * Math.abs(scaleY)) * sin));
	const nh = Math.max(1, Math.ceil((w * Math.abs(scaleX)) * sin + (h * Math.abs(scaleY)) * cos));

	const nc = document.createElement("canvas");
	nc.width = nw;
	nc.height = nh;
	const ctx = nc.getContext("2d")!;
	ctx.translate(nw / 2, nh / 2);
	ctx.rotate(rad);
	ctx.scale(scaleX, scaleY);
	if (layer.mask) {
		const tmp = document.createElement("canvas");
		tmp.width = w;
		tmp.height = h;
		const tctx = tmp.getContext("2d")!;
		tctx.drawImage(layer.canvas, 0, 0);
		tctx.globalCompositeOperation = "destination-in";
		tctx.drawImage(layer.mask, 0, 0);
		ctx.drawImage(tmp, -w / 2, -h / 2);
	} else {
		ctx.drawImage(layer.canvas, -w / 2, -h / 2);
	}

	const cx = layer.x + w / 2;
	const cy = layer.y + h / 2;

	return {
		...layer,
		canvas: nc,
		x: cx - nw / 2,
		y: cy - nh / 2,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		mask: undefined,
		maskEditing: false,
	};
}

export function rotateLayerBy(layer: Layer, deltaDegrees: number): Layer {
	return {
		...layer,
		rotation: normalizeAngle((layer.rotation ?? 0) + deltaDegrees),
	};
}

export function ensureLayerMask(layer: Layer): Layer {
	if (layer.mask) return layer;
	return { ...layer, mask: ensureMaskCanvas(layer) };
}
