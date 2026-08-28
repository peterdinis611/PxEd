/**
 * Pure ImageData ops shared by main thread and Web Worker.
 * Mutates `data` in place.
 */

export type ImageOpName =
	| "brightnessContrast"
	| "hsl"
	| "levels"
	| "invert"
	| "grayscale"
	| "colorBalance"
	| "blur"
	| "sharpen"
	| "noise"
	| "pixelate"
	| "emboss";

export type ImageOpPayload =
	| { op: "brightnessContrast"; brightness: number; contrast: number }
	| { op: "hsl"; hue: number; sat: number; light: number }
	| { op: "levels"; blackIn: number; gamma: number; whiteIn: number }
	| { op: "invert" }
	| { op: "grayscale" }
	| { op: "colorBalance"; cyanRed: number; magentaGreen: number; yellowBlue: number }
	| { op: "blur"; radius: number }
	| { op: "sharpen" }
	| { op: "noise"; amount: number }
	| { op: "pixelate"; cellSize: number }
	| { op: "emboss" };

export function applyImageOp(
	width: number,
	height: number,
	buffer: Uint8ClampedArray,
	payload: ImageOpPayload,
): void {
	const data = { width, height, data: buffer } as ImageData;
	switch (payload.op) {
		case "brightnessContrast":
			brightnessContrastData(data, payload.brightness, payload.contrast);
			break;
		case "hsl":
			hslData(data, payload.hue, payload.sat, payload.light);
			break;
		case "levels":
			levelsData(data, payload.blackIn, payload.gamma, payload.whiteIn);
			break;
		case "invert":
			invertData(data);
			break;
		case "grayscale":
			grayscaleData(data);
			break;
		case "colorBalance":
			colorBalanceData(
				data,
				payload.cyanRed,
				payload.magentaGreen,
				payload.yellowBlue,
			);
			break;
		case "blur":
			blurData(data, payload.radius);
			break;
		case "sharpen":
			sharpenData(data);
			break;
		case "noise":
			noiseData(data, payload.amount);
			break;
		case "pixelate":
			pixelateData(data, payload.cellSize);
			break;
		case "emboss":
			embossData(data);
			break;
	}
}

export function brightnessContrastData(
	data: ImageData,
	brightness: number,
	contrast: number,
): void {
	const b = brightness * 2.55;
	const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
	for (let i = 0; i < data.data.length; i += 4) {
		for (let c = 0; c < 3; c++) {
			let v = data.data[i + c]! + b;
			v = factor * (v - 128) + 128;
			data.data[i + c] = Math.min(255, Math.max(0, v));
		}
	}
}

export function hslData(
	data: ImageData,
	hue: number,
	sat: number,
	light: number,
): void {
	const sMult = 1 + sat / 100;
	const lAdd = light * 2.55;
	for (let i = 0; i < data.data.length; i += 4) {
		let [h, s, l] = rgbToHsl(
			data.data[i]!,
			data.data[i + 1]!,
			data.data[i + 2]!,
		);
		h = (h + hue / 360) % 1;
		if (h < 0) h += 1;
		s = Math.min(1, Math.max(0, s * sMult));
		l = Math.min(1, Math.max(0, l + lAdd / 255));
		const [r, g, b] = hslToRgb(h, s, l);
		data.data[i] = r;
		data.data[i + 1] = g;
		data.data[i + 2] = b;
	}
}

export function levelsData(
	data: ImageData,
	blackIn: number,
	gamma: number,
	whiteIn: number,
): void {
	const lut = new Uint8Array(256);
	const b = blackIn / 255;
	const w = whiteIn / 255;
	const g = Math.max(0.1, gamma);
	for (let i = 0; i < 256; i++) {
		let n = i / 255;
		if (n <= b) n = 0;
		else if (n >= w) n = 1;
		else n = ((n - b) / (w - b)) ** (1 / g);
		lut[i] = Math.round(n * 255);
	}
	for (let i = 0; i < data.data.length; i += 4) {
		for (let c = 0; c < 3; c++) {
			data.data[i + c] = lut[data.data[i + c]!]!;
		}
	}
}

export function invertData(data: ImageData): void {
	for (let i = 0; i < data.data.length; i += 4) {
		data.data[i] = 255 - data.data[i]!;
		data.data[i + 1] = 255 - data.data[i + 1]!;
		data.data[i + 2] = 255 - data.data[i + 2]!;
	}
}

export function grayscaleData(data: ImageData): void {
	for (let i = 0; i < data.data.length; i += 4) {
		const g =
			data.data[i]! * 0.299 +
			data.data[i + 1]! * 0.587 +
			data.data[i + 2]! * 0.114;
		data.data[i] = g;
		data.data[i + 1] = g;
		data.data[i + 2] = g;
	}
}

export function colorBalanceData(
	data: ImageData,
	cyanRed: number,
	magentaGreen: number,
	yellowBlue: number,
): void {
	for (let i = 0; i < data.data.length; i += 4) {
		data.data[i] = Math.min(255, Math.max(0, data.data[i]! + cyanRed));
		data.data[i + 1] = Math.min(
			255,
			Math.max(0, data.data[i + 1]! + magentaGreen),
		);
		data.data[i + 2] = Math.min(
			255,
			Math.max(0, data.data[i + 2]! + yellowBlue),
		);
	}
}

export function blurData(data: ImageData, radius: number): void {
	const { width, height } = data;
	const src = new Uint8ClampedArray(data.data);
	const r = Math.max(1, Math.floor(radius));
	const kernel: number[] = [];
	let sum = 0;
	const sigma = r / 2;
	for (let i = -r; i <= r; i++) {
		const v = Math.exp(-(i * i) / (2 * sigma * sigma));
		kernel.push(v);
		sum += v;
	}
	for (let i = 0; i < kernel.length; i++) kernel[i]! /= sum;

	const temp = new Float32Array(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			for (let c = 0; c < 4; c++) {
				let v = 0;
				for (let k = -r; k <= r; k++) {
					const px = Math.min(width - 1, Math.max(0, x + k));
					v += src[(y * width + px) * 4 + c]! * kernel[k + r]!;
				}
				temp[(y * width + x) * 4 + c] = v;
			}
		}
	}
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			for (let c = 0; c < 4; c++) {
				let v = 0;
				for (let k = -r; k <= r; k++) {
					const py = Math.min(height - 1, Math.max(0, y + k));
					v += temp[(py * width + x) * 4 + c]! * kernel[k + r]!;
				}
				const oi = (y * width + x) * 4 + c;
				data.data[oi] = c === 3 ? src[oi]! : Math.round(v);
			}
		}
	}
}

export function sharpenData(data: ImageData): void {
	const { width, height } = data;
	const src = new Uint8ClampedArray(data.data);
	const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
	const out = data.data;
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			for (let c = 0; c < 3; c++) {
				let v = 0;
				let ki = 0;
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						v += src[((y + ky) * width + (x + kx)) * 4 + c]! * kernel[ki]!;
						ki++;
					}
				}
				out[(y * width + x) * 4 + c] = Math.min(255, Math.max(0, v));
			}
			out[(y * width + x) * 4 + 3] = src[(y * width + x) * 4 + 3]!;
		}
	}
}

export function noiseData(data: ImageData, amount: number): void {
	const amt = amount / 100;
	for (let i = 0; i < data.data.length; i += 4) {
		const n = (Math.random() - 0.5) * 255 * amt;
		data.data[i] = Math.min(255, Math.max(0, data.data[i]! + n));
		data.data[i + 1] = Math.min(255, Math.max(0, data.data[i + 1]! + n));
		data.data[i + 2] = Math.min(255, Math.max(0, data.data[i + 2]! + n));
	}
}

export function pixelateData(data: ImageData, cellSize: number): void {
	const { width, height } = data;
	const size = Math.max(2, cellSize);
	const src = new Uint8ClampedArray(data.data);
	for (let y = 0; y < height; y += size) {
		for (let x = 0; x < width; x += size) {
			let r = 0,
				g = 0,
				b = 0,
				a = 0,
				count = 0;
			for (let dy = 0; dy < size && y + dy < height; dy++) {
				for (let dx = 0; dx < size && x + dx < width; dx++) {
					const idx = ((y + dy) * width + (x + dx)) * 4;
					r += src[idx]!;
					g += src[idx + 1]!;
					b += src[idx + 2]!;
					a += src[idx + 3]!;
					count++;
				}
			}
			r = Math.round(r / count);
			g = Math.round(g / count);
			b = Math.round(b / count);
			a = Math.round(a / count);
			for (let dy = 0; dy < size && y + dy < height; dy++) {
				for (let dx = 0; dx < size && x + dx < width; dx++) {
					const idx = ((y + dy) * width + (x + dx)) * 4;
					data.data[idx] = r;
					data.data[idx + 1] = g;
					data.data[idx + 2] = b;
					data.data[idx + 3] = a;
				}
			}
		}
	}
}

export function embossData(data: ImageData): void {
	const { width, height } = data;
	const src = new Uint8ClampedArray(data.data);
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const idx = (y * width + x) * 4;
			const left = src[(y * width + (x - 1)) * 4]!;
			const top = src[((y - 1) * width + x) * 4]!;
			const v = Math.min(255, Math.max(0, 128 + left - top));
			data.data[idx] = v;
			data.data[idx + 1] = v;
			data.data[idx + 2] = v;
			data.data[idx + 3] = 255;
		}
	}
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			default:
				h = ((r - g) / d + 4) / 6;
		}
	}
	return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
	if (s === 0) {
		const v = Math.round(l * 255);
		return [v, v, v];
	}
	const hue2rgb = (p: number, q: number, t: number) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	return [
		Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
		Math.round(hue2rgb(p, q, h) * 255),
		Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
	];
}
