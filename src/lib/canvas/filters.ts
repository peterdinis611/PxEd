import {
	blurData,
	embossData,
	noiseData,
	pixelateData,
	sharpenData,
} from "@/lib/canvas/imageOpsCore";

export function gaussianBlur(
	ctx: CanvasRenderingContext2D,
	radius: number,
): void {
	const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	blurData(data, radius);
	ctx.putImageData(data, 0, 0);
}

export function sharpen(ctx: CanvasRenderingContext2D): void {
	const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	sharpenData(data);
	ctx.putImageData(data, 0, 0);
}

export function pixelate(
	ctx: CanvasRenderingContext2D,
	cellSize: number,
): void {
	const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	pixelateData(data, cellSize);
	ctx.putImageData(data, 0, 0);
}

export function addNoise(ctx: CanvasRenderingContext2D, amount: number): void {
	const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	noiseData(data, amount);
	ctx.putImageData(data, 0, 0);
}

export function emboss(ctx: CanvasRenderingContext2D): void {
	const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	embossData(data);
	ctx.putImageData(data, 0, 0);
}
