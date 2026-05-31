import { drawLayerWithTransform } from "@/lib/canvas/transform";
import type { Layer } from "@/types/editor";
import { BLEND_MODE_MAP } from "@/types/editor";

function rgbToHex(r: number, g: number, b: number): string {
	return `#${[r, g, b]
		.map((v) =>
			Math.min(255, Math.max(0, Math.round(v)))
				.toString(16)
				.padStart(2, "0"),
		)
		.join("")}`;
}

/** Visible color at a document point (all visible layers composited). */
export function sampleColorAtDocPoint(
	layers: Layer[],
	docWidth: number,
	docHeight: number,
	backgroundColor: string,
	docX: number,
	docY: number,
	sampleSize: number,
): string | null {
	const radius = Math.floor(sampleSize / 2);
	const cx = Math.floor(docX);
	const cy = Math.floor(docY);

	let x0 = cx - radius;
	let y0 = cy - radius;
	let w = sampleSize;
	let h = sampleSize;

	if (x0 < 0) {
		w += x0;
		x0 = 0;
	}
	if (y0 < 0) {
		h += y0;
		y0 = 0;
	}
	if (x0 + w > docWidth) w = docWidth - x0;
	if (y0 + h > docHeight) h = docHeight - y0;
	if (w <= 0 || h <= 0) return null;

	const patch = document.createElement("canvas");
	patch.width = w;
	patch.height = h;
	const ctx = patch.getContext("2d", { willReadFrequently: true })!;
	ctx.fillStyle = backgroundColor;
	ctx.fillRect(0, 0, w, h);
	ctx.translate(-x0, -y0);

	for (const layer of layers) {
		if (!layer.visible) continue;
		ctx.save();
		ctx.globalAlpha = layer.opacity / 100;
		ctx.globalCompositeOperation = BLEND_MODE_MAP[layer.blendMode];
		drawLayerWithTransform(ctx, layer);
		ctx.restore();
	}

	const data = ctx.getImageData(0, 0, w, h).data;
	let tr = 0;
	let tg = 0;
	let tb = 0;
	let n = 0;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3]! < 8) continue;
		tr += data[i]!;
		tg += data[i + 1]!;
		tb += data[i + 2]!;
		n++;
	}
	if (!n) {
		for (let i = 0; i < data.length; i += 4) {
			tr += data[i]!;
			tg += data[i + 1]!;
			tb += data[i + 2]!;
			n++;
		}
	}
	if (!n) return null;
	return rgbToHex(tr / n, tg / n, tb / n);
}

export function sampleRgbaAtDocPoint(
	layers: Layer[],
	docWidth: number,
	docHeight: number,
	backgroundColor: string,
	docX: number,
	docY: number,
): string {
	const hex = sampleColorAtDocPoint(
		layers,
		docWidth,
		docHeight,
		backgroundColor,
		docX,
		docY,
		1,
	);
	if (!hex) return "—";
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, 1)`;
}
