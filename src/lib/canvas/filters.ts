export function gaussianBlur(
	ctx: CanvasRenderingContext2D,
	radius: number,
): void {
	const { width, height } = ctx.canvas;
	const src = ctx.getImageData(0, 0, width, height);
	const dst = ctx.createImageData(width, height);
	const r = Math.max(1, Math.floor(radius));
	const kernel: number[] = [];
	let sum = 0;
	const sigma = r / 2;
	for (let i = -r; i <= r; i++) {
		const v = Math.exp(-(i * i) / (2 * sigma * sigma));
		kernel.push(v);
		sum += v;
	}
	kernel.forEach((_, i) => (kernel[i] = kernel[i]! / sum));

	const temp = new Float32Array(width * height * 4);
	const out = dst.data;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			for (let c = 0; c < 4; c++) {
				let v = 0;
				for (let k = -r; k <= r; k++) {
					const px = Math.min(width - 1, Math.max(0, x + k));
					const idx = (y * width + px) * 4 + c;
					v += src.data[idx]! * kernel[k + r]!;
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
					const idx = (py * width + x) * 4 + c;
					v += temp[idx]! * kernel[k + r]!;
				}
				const oi = (y * width + x) * 4 + c;
				out[oi] = c === 3 ? src.data[oi]! : Math.round(v);
			}
		}
	}

	ctx.putImageData(dst, 0, 0);
}

export function sharpen(ctx: CanvasRenderingContext2D): void {
	const { width, height } = ctx.canvas;
	const src = ctx.getImageData(0, 0, width, height);
	const dst = ctx.createImageData(width, height);
	const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			for (let c = 0; c < 3; c++) {
				let v = 0;
				let ki = 0;
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const idx = ((y + ky) * width + (x + kx)) * 4 + c;
						v += src.data[idx]! * kernel[ki]!;
						ki++;
					}
				}
				const oi = (y * width + x) * 4 + c;
				dst.data[oi] = Math.min(255, Math.max(0, v));
			}
			const ai = (y * width + x) * 4 + 3;
			dst.data[ai] = src.data[ai]!;
		}
	}
	ctx.putImageData(dst, 0, 0);
}

export function pixelate(
	ctx: CanvasRenderingContext2D,
	cellSize: number,
): void {
	const { width, height } = ctx.canvas;
	const size = Math.max(2, cellSize);
	const src = ctx.getImageData(0, 0, width, height);
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
					r += src.data[idx]!;
					g += src.data[idx + 1]!;
					b += src.data[idx + 2]!;
					a += src.data[idx + 3]!;
					count++;
				}
			}
			r = Math.round(r / count);
			g = Math.round(g / count);
			b = Math.round(b / count);
			a = Math.round(a / count);
			ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
			ctx.fillRect(x, y, size, size);
		}
	}
}

export function addNoise(ctx: CanvasRenderingContext2D, amount: number): void {
	const { width, height } = ctx.canvas;
	const data = ctx.getImageData(0, 0, width, height);
	const amt = amount / 100;
	for (let i = 0; i < data.data.length; i += 4) {
		const n = (Math.random() - 0.5) * 255 * amt;
		data.data[i] = Math.min(255, Math.max(0, data.data[i]! + n));
		data.data[i + 1] = Math.min(255, Math.max(0, data.data[i + 1]! + n));
		data.data[i + 2] = Math.min(255, Math.max(0, data.data[i + 2]! + n));
	}
	ctx.putImageData(data, 0, 0);
}

export function emboss(ctx: CanvasRenderingContext2D): void {
	const { width, height } = ctx.canvas;
	const src = ctx.getImageData(0, 0, width, height);
	const dst = ctx.createImageData(width, height);
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const idx = (y * width + x) * 4;
			const left = src.data[(y * width + (x - 1)) * 4]!;
			const top = src.data[((y - 1) * width + x) * 4]!;
			const v = Math.min(255, Math.max(0, 128 + left - top));
			dst.data[idx] = v;
			dst.data[idx + 1] = v;
			dst.data[idx + 2] = v;
			dst.data[idx + 3] = 255;
		}
	}
	ctx.putImageData(dst, 0, 0);
}
