import {
	createLayer,
	restoreLayerFromSnapshot,
	snapshotLayer,
} from "@/lib/canvas/layers";
import { selectionBounds } from "@/lib/canvas/selection";
import { drawLayerWithTransform } from "@/lib/canvas/transform";
import type { Layer, LayerSnapshot, Selection } from "@/types/editor";

function flattenToCanvas(
	layers: Layer[],
	width: number,
	height: number,
	background: string,
): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d")!;
	ctx.fillStyle = background;
	ctx.fillRect(0, 0, width, height);

	for (const layer of layers) {
		if (!layer.visible) continue;
		ctx.save();
		ctx.globalAlpha = layer.opacity / 100;
		ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
		drawLayerWithTransform(ctx, layer);
		ctx.restore();
	}

	return canvas;
}

export function exportFlattenedPng(
	layers: Layer[],
	width: number,
	height: number,
	background = "#ffffff",
): void {
	const canvas = flattenToCanvas(layers, width, height, background);
	downloadCanvas(canvas, "image.png");
}

export function exportJpeg(
	layers: Layer[],
	width: number,
	height: number,
	quality: number,
	background = "#ffffff",
): void {
	const canvas = flattenToCanvas(layers, width, height, background);
	const link = document.createElement("a");
	link.download = "image.jpg";
	link.href = canvas.toDataURL("image/jpeg", quality / 100);
	link.click();
}

export function exportWebp(
	layers: Layer[],
	width: number,
	height: number,
	quality: number,
	background = "#ffffff",
): void {
	const canvas = flattenToCanvas(layers, width, height, background);
	const link = document.createElement("a");
	link.download = "image.webp";
	link.href = canvas.toDataURL("image/webp", quality / 100);
	link.click();
}

/** Export only the current selection (bounding box) as PNG. */
export function exportSelectionPng(
	layers: Layer[],
	width: number,
	height: number,
	selection: Selection | null,
	background = "#ffffff",
): boolean {
	const bounds = selectionBounds(selection);
	if (!bounds || bounds.width < 1 || bounds.height < 1) return false;

	const full = flattenToCanvas(layers, width, height, background);
	const x = Math.max(0, Math.floor(bounds.x));
	const y = Math.max(0, Math.floor(bounds.y));
	const w = Math.min(Math.ceil(bounds.width), width - x);
	const h = Math.min(Math.ceil(bounds.height), height - y);
	if (w < 1 || h < 1) return false;

	const crop = document.createElement("canvas");
	crop.width = w;
	crop.height = h;
	crop.getContext("2d")!.drawImage(full, x, y, w, h, 0, 0, w, h);
	downloadCanvas(crop, "selection.png");
	return true;
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
	const link = document.createElement("a");
	link.download = filename;
	link.href = canvas.toDataURL("image/png");
	link.click();
}

export interface ProjectViewState {
	zoom: number;
	panX: number;
	panY: number;
	showGrid: boolean;
	showRulers: boolean;
	snapToGrid: boolean;
	gridSize: number;
}

/** Project file — v2 adds selection + view chrome. */
export interface ProjectJson {
	version: 1 | 2;
	canvasWidth: number;
	canvasHeight: number;
	layers: LayerSnapshot[];
	activeLayerId: string | null;
	/** v2 */
	selection?: Selection | null;
	selectionInverted?: boolean;
	view?: ProjectViewState;
	canvasBackground?: string;
}

export type ProjectExportInput = {
	layers: Layer[];
	canvasWidth: number;
	canvasHeight: number;
	activeLayerId: string | null;
	selection: Selection | null;
	selectionInverted: boolean;
	view: ProjectViewState;
	canvasBackground: string;
};

export function exportProjectJson(input: ProjectExportInput): void {
	const data: ProjectJson = {
		version: 2,
		canvasWidth: input.canvasWidth,
		canvasHeight: input.canvasHeight,
		layers: input.layers.map(snapshotLayer),
		activeLayerId: input.activeLayerId,
		selection: input.selection,
		selectionInverted: input.selectionInverted,
		view: input.view,
		canvasBackground: input.canvasBackground,
	};
	const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.download = "project.pxed.json";
	link.href = url;
	link.click();
	URL.revokeObjectURL(url);
}

export function parseProjectJson(json: string): ProjectJson {
	const data = JSON.parse(json) as ProjectJson;
	if (!data.layers || !data.canvasWidth)
		throw new Error("Invalid project file");
	if (data.version !== 1 && data.version !== 2) {
		// Accept missing version as v1
		data.version = 1;
	}
	return data;
}

export function loadImageToLayer(
	img: HTMLImageElement,
	width: number,
	height: number,
): Layer[] {
	const layer = createLayer(width, height, "Imported");
	const ctx = layer.canvas.getContext("2d")!;
	const scale = Math.min(width / img.width, height / img.height, 1);
	const w = img.width * scale;
	const h = img.height * scale;
	ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
	return [layer];
}

export function restoreProject(data: ProjectJson) {
	const layers = data.layers.map((s) =>
		restoreLayerFromSnapshot(s, data.canvasWidth, data.canvasHeight),
	);
	return {
		layers,
		canvasWidth: data.canvasWidth,
		canvasHeight: data.canvasHeight,
		activeLayerId: data.activeLayerId ?? layers[0]?.id ?? null,
		selection: data.version === 2 ? (data.selection ?? null) : null,
		selectionInverted:
			data.version === 2 ? Boolean(data.selectionInverted) : false,
		view: data.version === 2 ? data.view : undefined,
		canvasBackground: data.canvasBackground,
	};
}
