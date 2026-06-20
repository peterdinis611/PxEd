export function floodFill(
	ctx: CanvasRenderingContext2D,
	startX: number,
	startY: number,
	fillColor: string,
	tolerance = 32,
): void {
	const { width, height } = ctx.canvas;
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;
	const startIdx = (Math.floor(startY) * width + Math.floor(startX)) * 4;
	const target = [
		data[startIdx]!,
		data[startIdx + 1]!,
		data[startIdx + 2]!,
		data[startIdx + 3]!,
	];

	const fill = parseColor(fillColor);
	if (colorsMatch(target, fill, tolerance) && target[3] === fill[3]) return;

	const visited = new Uint8Array(width * height);
	const stack: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];

	const match = (idx: number) => {
		const r = data[idx]!;
		const g = data[idx + 1]!;
		const b = data[idx + 2]!;
		const a = data[idx + 3]!;
		return (
			Math.abs(r - target[0]!) <= tolerance &&
			Math.abs(g - target[1]!) <= tolerance &&
			Math.abs(b - target[2]!) <= tolerance &&
			Math.abs(a - target[3]!) <= tolerance
		);
	};

	while (stack.length > 0) {
		const [x, y] = stack.pop()!;
		if (x < 0 || y < 0 || x >= width || y >= height) continue;
		const pi = y * width + x;
		if (visited[pi]) continue;
		const idx = pi * 4;
		if (!match(idx)) continue;
		visited[pi] = 1;
		data[idx] = fill[0]!;
		data[idx + 1] = fill[1]!;
		data[idx + 2] = fill[2]!;
		data[idx + 3] = fill[3]!;
		stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
	}

	ctx.putImageData(imageData, 0, 0);
}

function parseColor(color: string): [number, number, number, number] {
	const c = document.createElement("canvas");
	const ctx = c.getContext("2d")!;
	ctx.fillStyle = color;
	const parsed = ctx.fillStyle;
	if (parsed.startsWith("#")) {
		const hex = parsed.slice(1);
		const full =
			hex.length === 3
				? hex
						.split("")
						.map((h) => h + h)
						.join("")
				: hex;
		return [
			parseInt(full.slice(0, 2), 16),
			parseInt(full.slice(2, 4), 16),
			parseInt(full.slice(4, 6), 16),
			255,
		];
	}
	const m = parsed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
	if (m) {
		return [+m[1]!, +m[2]!, +m[3]!, m[4] ? Math.round(+m[4] * 255) : 255];
	}
	return [0, 0, 0, 255];
}

function colorsMatch(
	a: number[],
	b: [number, number, number, number],
	tolerance: number,
): boolean {
	return (
		Math.abs(a[0]! - b[0]) <= tolerance &&
		Math.abs(a[1]! - b[1]) <= tolerance &&
		Math.abs(a[2]! - b[2]) <= tolerance
	);
}

export function magicWandSelect(
	ctx: CanvasRenderingContext2D,
	startX: number,
	startY: number,
	tolerance = 32,
	contiguous = true,
): { x: number; y: number; width: number; height: number } | null {
	const { width, height } = ctx.canvas;
	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;
	const sx = Math.floor(startX);
	const sy = Math.floor(startY);
	if (sx < 0 || sy < 0 || sx >= width || sy >= height) return null;

	const startIdx = (sy * width + sx) * 4;
	const target = [
		data[startIdx]!,
		data[startIdx + 1]!,
		data[startIdx + 2]!,
		data[startIdx + 3]!,
	];

	const match = (idx: number) => {
		const r = data[idx]!;
		const g = data[idx + 1]!;
		const b = data[idx + 2]!;
		const a = data[idx + 3]!;
		return (
			Math.abs(r - target[0]!) <= tolerance &&
			Math.abs(g - target[1]!) <= tolerance &&
			Math.abs(b - target[2]!) <= tolerance &&
			Math.abs(a - target[3]!) <= tolerance
		);
	};

	if (!contiguous) {
		let minX = width;
		let minY = height;
		let maxX = -1;
		let maxY = -1;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const idx = (y * width + x) * 4;
				if (!match(idx)) continue;
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			}
		}
		if (maxX < minX) return null;
		return {
			x: minX,
			y: minY,
			width: maxX - minX + 1,
			height: maxY - minY + 1,
		};
	}

	const visited = new Uint8Array(width * height);
	const stack: [number, number][] = [[sx, sy]];
	let minX = sx,
		minY = sy,
		maxX = sx,
		maxY = sy;

	while (stack.length > 0) {
		const [x, y] = stack.pop()!;
		if (x < 0 || y < 0 || x >= width || y >= height) continue;
		const pi = y * width + x;
		if (visited[pi]) continue;
		const idx = pi * 4;
		if (!match(idx)) continue;
		visited[pi] = 1;
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
		stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
	}

	if (maxX < minX) return null;
	return {
		x: minX,
		y: minY,
		width: maxX - minX + 1,
		height: maxY - minY + 1,
	};
}
