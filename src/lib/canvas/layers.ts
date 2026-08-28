import { generateId } from "@/lib/utils";
import type {
	BlendMode,
	Layer,
	LayerSnapshot,
	ShapeData,
	TextData,
} from "@/types/editor";
import type { ImageSourceMetadata } from "@/types/imageMetadata";
import { drawArrow } from "@/lib/canvas/shapes";
import { normalizeRect } from "@/lib/canvas/selection";

export function createLayerCanvas(
	width: number,
	height: number,
	fill?: string,
): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	if (fill) {
		const ctx = canvas.getContext("2d")!;
		ctx.fillStyle = fill;
		ctx.fillRect(0, 0, width, height);
	}
	return canvas;
}

export function createLayer(
	width: number,
	height: number,
	name: string,
	options?: {
		fill?: string;
		type?: Layer["type"];
		textData?: TextData;
		shapeData?: ShapeData;
		sourceMetadata?: ImageSourceMetadata;
	},
): Layer {
	return {
		id: generateId(),
		name,
		visible: true,
		locked: false,
		opacity: 100,
		blendMode: "normal" as BlendMode,
		canvas: createLayerCanvas(width, height, options?.fill),
		x: 0,
		y: 0,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		type: options?.type ?? "pixel",
		textData: options?.textData,
		shapeData: options?.shapeData,
		sourceMetadata: options?.sourceMetadata,
	};
}

export function cloneLayer(layer: Layer): Layer {
	const canvas = createLayerCanvas(layer.canvas.width, layer.canvas.height);
	const ctx = canvas.getContext("2d")!;
	ctx.drawImage(layer.canvas, 0, 0);
	let mask: HTMLCanvasElement | undefined;
	if (layer.mask) {
		mask = createLayerCanvas(layer.mask.width, layer.mask.height);
		mask.getContext("2d")!.drawImage(layer.mask, 0, 0);
	}
	return {
		...layer,
		id: generateId(),
		name: `${layer.name} copy`,
		canvas,
		mask,
		scaleX: layer.scaleX ?? 1,
		scaleY: layer.scaleY ?? 1,
		textData: layer.textData ? { ...layer.textData } : undefined,
		shapeData: layer.shapeData ? { ...layer.shapeData } : undefined,
		sourceMetadata: layer.sourceMetadata
			? {
					...layer.sourceMetadata,
					exif: layer.sourceMetadata.exif
						? { ...layer.sourceMetadata.exif }
						: undefined,
				}
			: undefined,
	};
}

export function snapshotLayer(layer: Layer): LayerSnapshot {
	const ctx = layer.canvas.getContext("2d")!;
	return {
		id: layer.id,
		name: layer.name,
		visible: layer.visible,
		locked: layer.locked,
		opacity: layer.opacity,
		blendMode: layer.blendMode,
		imageData: ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height),
		x: layer.x,
		y: layer.y,
		rotation: layer.rotation ?? 0,
		scaleX: layer.scaleX ?? 1,
		scaleY: layer.scaleY ?? 1,
		maskImageData: layer.mask
			? layer.mask
					.getContext("2d")!
					.getImageData(0, 0, layer.mask.width, layer.mask.height)
			: undefined,
		maskEditing: layer.maskEditing,
		type: layer.type,
		textData: layer.textData ? { ...layer.textData } : undefined,
		shapeData: layer.shapeData ? { ...layer.shapeData } : undefined,
		sourceMetadata: layer.sourceMetadata
			? {
					...layer.sourceMetadata,
					exif: layer.sourceMetadata.exif
						? { ...layer.sourceMetadata.exif }
						: undefined,
				}
			: undefined,
	};
}

export function restoreLayerFromSnapshot(
	snap: LayerSnapshot,
	width: number,
	height: number,
): Layer {
	const canvas = createLayerCanvas(
		snap.imageData.width || width,
		snap.imageData.height || height,
	);
	const ctx = canvas.getContext("2d")!;
	ctx.putImageData(snap.imageData, 0, 0);
	let mask: HTMLCanvasElement | undefined;
	if (snap.maskImageData) {
		mask = createLayerCanvas(snap.maskImageData.width, snap.maskImageData.height);
		mask.getContext("2d")!.putImageData(snap.maskImageData, 0, 0);
	}
	return {
		id: snap.id,
		name: snap.name,
		visible: snap.visible,
		locked: snap.locked,
		opacity: snap.opacity,
		blendMode: snap.blendMode,
		canvas,
		x: snap.x,
		y: snap.y,
		rotation: snap.rotation ?? 0,
		scaleX: snap.scaleX ?? 1,
		scaleY: snap.scaleY ?? 1,
		mask,
		maskEditing: snap.maskEditing,
		type: snap.type,
		textData: snap.textData ? { ...snap.textData } : undefined,
		shapeData: snap.shapeData ? { ...snap.shapeData } : undefined,
		sourceMetadata: snap.sourceMetadata
			? {
					...snap.sourceMetadata,
					exif: snap.sourceMetadata.exif
						? { ...snap.sourceMetadata.exif }
						: undefined,
				}
			: undefined,
	};
}

export function renderTextLayer(layer: Layer): void {
	if (layer.type !== "text" || !layer.textData) return;
	const ctx = layer.canvas.getContext("2d")!;
	const { text, font, size, color, bold, italic, align, x, y } = layer.textData;
	ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
	const style = `${italic ? "italic " : ""}${bold ? "bold " : ""}${size}px ${font}`;
	ctx.font = style;
	ctx.fillStyle = color;
	ctx.textAlign = align;
	ctx.textBaseline = "top";
	const lines = text.split("\n");
	const lineHeight = size * ((layer.textData.lineHeight ?? 120) / 100);
	lines.forEach((line, i) => {
		const ly = y + i * lineHeight;
		ctx.fillText(line, x, ly);
		if (layer.textData?.underline) {
			const metrics = ctx.measureText(line);
			const underlineY = ly + size + 2;
			ctx.beginPath();
			ctx.strokeStyle = color;
			ctx.lineWidth = Math.max(1, size / 12);
			ctx.moveTo(x, underlineY);
			ctx.lineTo(x + metrics.width, underlineY);
			ctx.stroke();
		}
	});
}

/** Rasterize editable shape data onto the layer canvas (keeps shapeData for re-edit). */
export function renderShapeLayer(layer: Layer): void {
	if (layer.type !== "shape" || !layer.shapeData) return;
	const ctx = layer.canvas.getContext("2d")!;
	const s = layer.shapeData;
	ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
	ctx.lineCap = s.lineCap;
	ctx.lineJoin = s.lineJoin;
	ctx.lineWidth = s.strokeWidth;
	ctx.strokeStyle = s.strokeColor;
	ctx.fillStyle = s.fillColor;

	if (s.kind === "rect") {
		const r = normalizeRect(s.x0, s.y0, s.x1, s.y1);
		if (s.filled) {
			if (s.cornerRadius > 0) {
				ctx.beginPath();
				ctx.roundRect(r.x, r.y, r.width, r.height, s.cornerRadius);
				ctx.fill();
			} else {
				ctx.fillRect(r.x, r.y, r.width, r.height);
			}
		}
		if (s.cornerRadius > 0) {
			ctx.beginPath();
			ctx.roundRect(r.x, r.y, r.width, r.height, s.cornerRadius);
			ctx.stroke();
		} else {
			ctx.strokeRect(r.x, r.y, r.width, r.height);
		}
	} else if (s.kind === "ellipse") {
		const r = normalizeRect(s.x0, s.y0, s.x1, s.y1);
		ctx.beginPath();
		ctx.ellipse(
			r.x + r.width / 2,
			r.y + r.height / 2,
			Math.abs(r.width / 2),
			Math.abs(r.height / 2),
			0,
			0,
			Math.PI * 2,
		);
		if (s.filled) ctx.fill();
		ctx.stroke();
	} else if (s.kind === "line") {
		ctx.beginPath();
		ctx.moveTo(s.x0, s.y0);
		ctx.lineTo(s.x1, s.y1);
		ctx.stroke();
	} else if (s.kind === "arrow") {
		drawArrow(ctx, s.x0, s.y0, s.x1, s.y1, s.strokeWidth, s.lineCap);
	}
}
