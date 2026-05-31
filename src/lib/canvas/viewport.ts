export interface ViewportLayout {
	scale: number;
	drawW: number;
	drawH: number;
	offsetX: number;
	offsetY: number;
	canvasW: number;
	canvasH: number;
}

/** zoom 100 = document fitted to fill available viewport (uniform scale). */
export function getViewportLayout(
	viewportW: number,
	viewportH: number,
	docWidth: number,
	docHeight: number,
	zoomPercent: number,
	panX: number,
	panY: number,
	padding = 0,
): ViewportLayout {
	const availW = Math.max(1, viewportW - padding * 2);
	const availH = Math.max(1, viewportH - padding * 2);
	const fitScale = Math.min(availW / docWidth, availH / docHeight);
	const scale = fitScale * (zoomPercent / 100);
	const drawW = docWidth * scale;
	const drawH = docHeight * scale;
	const offsetX = padding + (availW - drawW) / 2 + panX;
	const offsetY = padding + (availH - drawH) / 2 + panY;
	const canvasW = Math.max(viewportW, Math.ceil(drawW + padding * 2));
	const canvasH = Math.max(viewportH, Math.ceil(drawH + padding * 2));

	return {
		scale,
		drawW,
		drawH,
		offsetX,
		offsetY,
		canvasW,
		canvasH,
	};
}

export function computeFitViewport(): {
	zoom: number;
	panX: number;
	panY: number;
} {
	return { zoom: 100, panX: 0, panY: 0 };
}

export function screenToDocFromLayout(
	screenX: number,
	screenY: number,
	rect: DOMRect,
	layout: Pick<ViewportLayout, "scale" | "offsetX" | "offsetY">,
): { x: number; y: number } {
	const localX = screenX - rect.left;
	const localY = screenY - rect.top;
	return {
		x: (localX - layout.offsetX) / layout.scale,
		y: (localY - layout.offsetY) / layout.scale,
	};
}
