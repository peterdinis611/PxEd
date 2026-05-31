import { createLayer, createLayerCanvas } from "@/lib/canvas/layers";
import type { Layer } from "@/types/editor";

export function createTestLayer(
	width = 100,
	height = 80,
	name = "Layer",
	options?: Parameters<typeof createLayer>[3],
): Layer {
	return createLayer(width, height, name, options);
}

/** Layer with a filled opaque rectangle for hit-testing. */
export function createFilledLayer(
	width = 100,
	height = 80,
	name = "Shape",
	fill = "#000000",
): Layer {
	const layer = createTestLayer(width, height, name);
	const ctx = layer.canvas.getContext("2d")!;
	ctx.fillStyle = fill;
	ctx.fillRect(10, 10, width - 20, height - 20);
	return layer;
}

export function createBackdropLayer(
	docWidth: number,
	docHeight: number,
): Layer {
	return createLayer(docWidth, docHeight, "Background", { fill: "#ffffff" });
}

export function paintPixel(
	layer: Layer,
	x: number,
	y: number,
	color = "rgba(0,0,0,255)",
): void {
	const ctx = layer.canvas.getContext("2d")!;
	ctx.fillStyle = color;
	ctx.fillRect(x, y, 1, 1);
}

export { createLayerCanvas };
