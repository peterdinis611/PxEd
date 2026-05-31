/**
 * Minimal Canvas 2D polyfill for jsdom so layer/canvas unit tests can run in Vitest.
 */

export function installImageDataPolyfill(): void {
	if (typeof globalThis.ImageData !== "undefined") return;

	class ImageDataPolyfill {
		readonly width: number;
		readonly height: number;
		readonly data: Uint8ClampedArray;

		constructor(sw: number, sh: number, data?: Uint8ClampedArray) {
			this.width = sw;
			this.height = sh;
			this.data = data ?? new Uint8ClampedArray(sw * sh * 4);
		}
	}

	globalThis.ImageData = ImageDataPolyfill as unknown as typeof ImageData;
}

const pixelStores = new WeakMap<HTMLCanvasElement, ImageData>();

function ensureSize(el: HTMLCanvasElement): ImageData {
	const w = Math.max(1, el.width || 1);
	const h = Math.max(1, el.height || 1);
	let store = pixelStores.get(el);
	if (!store || store.width !== w || store.height !== h) {
		store = new ImageData(w, h);
		pixelStores.set(el, store);
	}
	return store;
}

function parseColor(fillStyle: string): [number, number, number, number] {
	if (fillStyle.startsWith("rgba")) {
		const m = fillStyle.match(/[\d.]+/g);
		if (m && m.length >= 4) {
			return [
				Number(m[0]),
				Number(m[1]),
				Number(m[2]),
				Math.round(Number(m[3]) * 255),
			];
		}
	}
	if (fillStyle.startsWith("#") && fillStyle.length >= 7) {
		return [
			parseInt(fillStyle.slice(1, 3), 16),
			parseInt(fillStyle.slice(3, 5), 16),
			parseInt(fillStyle.slice(5, 7), 16),
			255,
		];
	}
	return [0, 0, 0, 255];
}

export function installCanvasPolyfill(): void {
	if (typeof HTMLCanvasElement === "undefined") return;

	HTMLCanvasElement.prototype.getContext = function (type: string) {
		if (type !== "2d") return null;
		const el = this as HTMLCanvasElement;
		let fillStyle = "#000000";

		let translateX = 0;
		let translateY = 0;
		let globalAlpha = 1;
		const stateStack: {
			translateX: number;
			translateY: number;
			globalAlpha: number;
			fillStyle: string;
		}[] = [];

		const ctx = {
			canvas: el,
			fillStyle: "#000000",
			globalCompositeOperation: "source-over",
			set fillStyle(value: string) {
				fillStyle = value;
			},
			get fillStyle() {
				return fillStyle;
			},
			get globalAlpha() {
				return globalAlpha;
			},
			set globalAlpha(value: number) {
				globalAlpha = value;
			},
			save() {
				stateStack.push({
					translateX,
					translateY,
					globalAlpha,
					fillStyle,
				});
			},
			restore() {
				const prev = stateStack.pop();
				if (!prev) return;
				translateX = prev.translateX;
				translateY = prev.translateY;
				globalAlpha = prev.globalAlpha;
				fillStyle = prev.fillStyle;
			},
			translate(dx: number, dy: number) {
				translateX += dx;
				translateY += dy;
			},
			rotate() {},
			fillRect(x: number, y: number, w: number, h: number) {
				const img = ensureSize(el);
				const [r, g, b, a] = parseColor(fillStyle);
				const alpha = Math.round(a * globalAlpha);
				const x0 = Math.max(0, Math.floor(x + translateX));
				const y0 = Math.max(0, Math.floor(y + translateY));
				const x1 = Math.min(img.width, Math.ceil(x + w));
				const y1 = Math.min(img.height, Math.ceil(y + h));
				for (let py = y0; py < y1; py++) {
					for (let px = x0; px < x1; px++) {
						const i = (py * img.width + px) * 4;
						img.data[i] = r;
						img.data[i + 1] = g;
						img.data[i + 2] = b;
						img.data[i + 3] = alpha;
					}
				}
			},
			clearRect(x: number, y: number, w: number, h: number) {
				const img = ensureSize(el);
				const x0 = Math.max(0, Math.floor(x));
				const y0 = Math.max(0, Math.floor(y));
				const x1 = Math.min(img.width, Math.ceil(x + w));
				const y1 = Math.min(img.height, Math.ceil(y + h));
				for (let py = y0; py < y1; py++) {
					for (let px = x0; px < x1; px++) {
						const i = (py * img.width + px) * 4;
						img.data[i + 3] = 0;
					}
				}
			},
			getImageData(sx: number, sy: number, sw: number, sh: number) {
				const src = ensureSize(el);
				const out = new ImageData(sw, sh);
				for (let y = 0; y < sh; y++) {
					for (let x = 0; x < sw; x++) {
						const srcX = sx + x;
						const srcY = sy + y;
						if (
							srcX < 0 ||
							srcY < 0 ||
							srcX >= src.width ||
							srcY >= src.height
						) {
							continue;
						}
						const si = (srcY * src.width + srcX) * 4;
						const di = (y * sw + x) * 4;
						out.data[di] = src.data[si]!;
						out.data[di + 1] = src.data[si + 1]!;
						out.data[di + 2] = src.data[si + 2]!;
						out.data[di + 3] = src.data[si + 3]!;
					}
				}
				return out;
			},
			putImageData(data: ImageData, dx: number, dy: number) {
				const dest = ensureSize(el);
				for (let y = 0; y < data.height; y++) {
					for (let x = 0; x < data.width; x++) {
						const destX = dx + x;
						const destY = dy + y;
						if (
							destX < 0 ||
							destY < 0 ||
							destX >= dest.width ||
							destY >= dest.height
						) {
							continue;
						}
						const si = (y * data.width + x) * 4;
						const di = (destY * dest.width + destX) * 4;
						dest.data[di] = data.data[si]!;
						dest.data[di + 1] = data.data[si + 1]!;
						dest.data[di + 2] = data.data[si + 2]!;
						dest.data[di + 3] = data.data[si + 3]!;
					}
				}
			},
			drawImage(source: CanvasImageSource, dx = 0, dy = 0) {
				const from =
					source instanceof HTMLCanvasElement ? ensureSize(source) : null;
				if (!from) return;
				const dest = ensureSize(el);
				const destX = Math.floor(dx + translateX);
				const destY = Math.floor(dy + translateY);
				const sw = Math.min(from.width, dest.width - destX);
				const sh = Math.min(from.height, dest.height - destY);
				for (let y = 0; y < sh; y++) {
					for (let x = 0; x < sw; x++) {
						const si = (y * from.width + x) * 4;
						const px = destX + x;
						const py = destY + y;
						if (px < 0 || py < 0 || px >= dest.width || py >= dest.height)
							continue;
						const di = (py * dest.width + px) * 4;
						const srcA = (from.data[si + 3]! / 255) * globalAlpha;
						const outA = Math.round(srcA * 255);
						dest.data[di] = from.data[si]!;
						dest.data[di + 1] = from.data[si + 1]!;
						dest.data[di + 2] = from.data[si + 2]!;
						dest.data[di + 3] = outA;
					}
				}
			},
		};

		return ctx as unknown as CanvasRenderingContext2D;
	};

	HTMLCanvasElement.prototype.toDataURL = () =>
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
}
