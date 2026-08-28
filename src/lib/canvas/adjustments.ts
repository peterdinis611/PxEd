import {
	brightnessContrastData,
	colorBalanceData,
	grayscaleData,
	hslData,
	invertData,
	levelsData,
} from "@/lib/canvas/imageOpsCore";

export function brightnessContrast(
	ctx: CanvasRenderingContext2D,
	brightness: number,
	contrast: number,
): void {
	const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	brightnessContrastData(data, brightness, contrast);
	ctx.putImageData(data, 0, 0);
}

export function hueSaturationLightness(
	ctx: CanvasRenderingContext2D,
	hue: number,
	sat: number,
	light: number,
): void {
	const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	hslData(data, hue, sat, light);
	ctx.putImageData(data, 0, 0);
}

export function levels(
	ctx: CanvasRenderingContext2D,
	blackIn: number,
	gamma: number,
	whiteIn: number,
): void {
	const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	levelsData(data, blackIn, gamma, whiteIn);
	ctx.putImageData(data, 0, 0);
}

export function invertColors(ctx: CanvasRenderingContext2D): void {
	const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	invertData(data);
	ctx.putImageData(data, 0, 0);
}

export function grayscale(ctx: CanvasRenderingContext2D): void {
	const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	grayscaleData(data);
	ctx.putImageData(data, 0, 0);
}

export function colorBalance(
	ctx: CanvasRenderingContext2D,
	cyanRed: number,
	magentaGreen: number,
	yellowBlue: number,
): void {
	const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
	colorBalanceData(data, cyanRed, magentaGreen, yellowBlue);
	ctx.putImageData(data, 0, 0);
}
