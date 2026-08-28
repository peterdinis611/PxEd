import type { ImageSourceMetadata } from "@/types/imageMetadata";

export type BlendMode =
	| "normal"
	| "multiply"
	| "screen"
	| "overlay"
	| "darken"
	| "lighten"
	| "color-dodge"
	| "color-burn"
	| "hard-light"
	| "soft-light"
	| "difference"
	| "exclusion";

export type ToolName =
	| "move"
	| "hand"
	| "marquee-rect"
	| "marquee-ellipse"
	| "lasso"
	| "polygon-lasso"
	| "magic-wand"
	| "crop"
	| "brush"
	| "pencil"
	| "eraser"
	| "clone-stamp"
	| "fill"
	| "gradient"
	| "eyedropper"
	| "text"
	| "shape-rect"
	| "shape-ellipse"
	| "shape-line"
	| "shape-arrow"
	| "zoom";

export interface TextData {
	text: string;
	font: string;
	size: number;
	color: string;
	bold: boolean;
	italic: boolean;
	align: CanvasTextAlign;
	x: number;
	y: number;
	underline?: boolean;
	/** Percent of font size, e.g. 120 = 1.2× */
	lineHeight?: number;
}

export interface ShapeData {
	kind: "rect" | "ellipse" | "line" | "arrow";
	x0: number;
	y0: number;
	x1: number;
	y1: number;
	fillColor: string;
	strokeColor: string;
	strokeWidth: number;
	filled: boolean;
	cornerRadius: number;
	lineCap: CanvasLineCap;
	lineJoin: CanvasLineJoin;
}

export interface GradientStop {
	offset: number;
	color: string;
}

export interface GradientSettings {
	type: "linear" | "radial";
	stops: GradientStop[];
}

export interface Layer {
	id: string;
	name: string;
	visible: boolean;
	locked: boolean;
	opacity: number;
	blendMode: BlendMode;
	canvas: HTMLCanvasElement;
	x: number;
	y: number;
	/** Rotation in degrees around the layer center. */
	rotation: number;
	/** Uniform-ish scale around the layer center. Defaults to 1. */
	scaleX: number;
	scaleY: number;
	/** Optional grayscale alpha mask (same size as canvas). White = visible. */
	mask?: HTMLCanvasElement;
	/** When true, brush/eraser paints on the mask instead of pixels. */
	maskEditing?: boolean;
	type: "pixel" | "text" | "shape";
	textData?: TextData;
	shapeData?: ShapeData;
	/** Populated when the layer was imported from a raster file. */
	sourceMetadata?: ImageSourceMetadata;
}

export interface SelectionRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface LassoPath {
	type: "lasso";
	points: { x: number; y: number }[];
}

export interface EllipseSelection {
	type: "ellipse";
	x: number;
	y: number;
	width: number;
	height: number;
}

export type Selection =
	| ({ type: "rect" } & SelectionRect)
	| EllipseSelection
	| LassoPath;

export interface LayerSnapshot {
	id: string;
	name: string;
	visible: boolean;
	locked: boolean;
	opacity: number;
	blendMode: BlendMode;
	imageData: ImageData;
	x: number;
	y: number;
	rotation: number;
	scaleX: number;
	scaleY: number;
	maskImageData?: ImageData;
	maskEditing?: boolean;
	type: "pixel" | "text" | "shape";
	textData?: TextData;
	shapeData?: ShapeData;
	sourceMetadata?: ImageSourceMetadata;
}

export interface HistoryEntry {
	layers: LayerSnapshot[];
	canvasWidth: number;
	canvasHeight: number;
	description: string;
	selection: Selection | null;
}

export interface BrushSettings {
	size: number;
	hardness: number;
	opacity: number;
	flow: number;
	spacing: number;
	blendMode:
		| "source-over"
		| "multiply"
		| "screen"
		| "overlay"
		| "darken"
		| "lighten";
	smoothing: number;
}

export interface ShapeSettings {
	fillColor: string;
	strokeColor: string;
	strokeWidth: number;
	filled: boolean;
	cornerRadius: number;
	lineCap: CanvasLineCap;
	lineJoin: CanvasLineJoin;
}

export interface MarqueeSettings {
	feather: number;
	antiAlias: boolean;
	fixedRatio: boolean;
	ratioW: number;
	ratioH: number;
}

export interface ViewSettings {
	snapToGrid: boolean;
	gridSize: number;
	showGrid: boolean;
	showRulers: boolean;
}

export const BLEND_MODE_MAP: Record<BlendMode, GlobalCompositeOperation> = {
	normal: "source-over",
	multiply: "multiply",
	screen: "screen",
	overlay: "overlay",
	darken: "darken",
	lighten: "lighten",
	"color-dodge": "color-dodge",
	"color-burn": "color-burn",
	"hard-light": "hard-light",
	"soft-light": "soft-light",
	difference: "difference",
	exclusion: "exclusion",
};

export const DEFAULT_BRUSH: BrushSettings = {
	size: 12,
	hardness: 80,
	opacity: 100,
	flow: 100,
	spacing: 25,
	blendMode: "source-over",
	smoothing: 50,
};

export interface BrushPreset {
	id: string;
	name: string;
	brush: Partial<BrushSettings>;
}

export const BRUSH_PRESETS: BrushPreset[] = [
	{ id: "fine", name: "Fine", brush: { size: 4, hardness: 100, opacity: 100, flow: 100 } },
	{ id: "soft", name: "Soft", brush: { size: 24, hardness: 30, opacity: 70, flow: 80 } },
	{ id: "ink", name: "Ink", brush: { size: 8, hardness: 95, opacity: 100, flow: 100 } },
	{ id: "air", name: "Airbrush", brush: { size: 48, hardness: 10, opacity: 40, flow: 50 } },
	{ id: "marker", name: "Marker", brush: { size: 18, hardness: 85, opacity: 90, flow: 100 } },
];

export const DEFAULT_SHAPE: ShapeSettings = {
	fillColor: "#000000",
	strokeColor: "#000000",
	strokeWidth: 2,
	filled: true,
	cornerRadius: 0,
	lineCap: "round",
	lineJoin: "round",
};

export const DEFAULT_MARQUEE: MarqueeSettings = {
	feather: 0,
	antiAlias: true,
	fixedRatio: false,
	ratioW: 1,
	ratioH: 1,
};

export const DEFAULT_GRADIENT: GradientSettings = {
	type: "linear",
	stops: [
		{ offset: 0, color: "#000000" },
		{ offset: 1, color: "#ffffff" },
	],
};
