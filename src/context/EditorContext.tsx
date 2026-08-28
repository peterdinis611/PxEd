import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useReducer,
} from "react";
import {
	type DraftCacheStatus,
	useEditorDraftCache,
} from "@/hooks/useEditorDraftCache";
import type { EditorDraftCache } from "@/lib/cache/draftStorage";
import { canRotateLayer } from "@/lib/canvas/layerBounds";
import {
	cloneLayer,
	createLayer,
	renderTextLayer,
	restoreLayerFromSnapshot,
	snapshotLayer,
} from "@/lib/canvas/layers";
import {
	bakeLayerRotation,
	normalizeAngle,
	rotateLayerBy,
} from "@/lib/canvas/transform";
import type {
	BlendMode,
	BrushSettings,
	HistoryEntry,
	Layer,
	MarqueeSettings,
	Selection,
	ShapeSettings,
	ToolName,
} from "@/types/editor";
import {
	clampDocumentSize,
	getHistoryLimit,
} from "@/lib/canvas/documentLimits";
import { DEFAULT_BRUSH, DEFAULT_GRADIENT, DEFAULT_MARQUEE, DEFAULT_SHAPE } from "@/types/editor";
import type { GradientSettings } from "@/types/editor";

export interface EditorState {
	layers: Layer[];
	activeLayerId: string | null;
	tool: ToolName;
	foregroundColor: string;
	backgroundColor: string;
	brush: BrushSettings;
	shape: ShapeSettings;
	marquee: MarqueeSettings;
	snapToGrid: boolean;
	gridSize: number;
	eyedropperSample: number;
	gradientAngle: number;
	gradient: GradientSettings;
	fillOpacity: number;
	textUnderline: boolean;
	textLineHeight: number;
	contiguousWand: boolean;
	zoom: number;
	panX: number;
	panY: number;
	selection: Selection | null;
	selectionInverted: boolean;
	history: HistoryEntry[];
	historyIndex: number;
	canvasWidth: number;
	canvasHeight: number;
	/** Fixed document backdrop (Konva rect), not a rotatable layer. */
	canvasBackground: string;
	showGrid: boolean;
	showRulers: boolean;
	clipboard: ImageData | null;
	magicWandTolerance: number;
	fillTolerance: number;
	textFont: string;
	textSize: number;
	textBold: boolean;
	textItalic: boolean;
	textAlign: CanvasTextAlign;
	recentColors: string[];
	/** Recent brush settings for quick recall. */
	recentBrushes: BrushSettings[];
	/** Clone-stamp source point in document space. */
	cloneSource: { x: number; y: number } | null;
	renderTick: number;
	fitRequest: number;
}

type Action =
	| { type: "SET_TOOL"; tool: ToolName }
	| { type: "SET_COLORS"; fg?: string; bg?: string }
	| { type: "SWAP_COLORS" }
	| { type: "RESET_COLORS" }
	| { type: "SET_BRUSH"; brush: Partial<BrushSettings> }
	| { type: "SET_SHAPE"; shape: Partial<ShapeSettings> }
	| { type: "SET_MARQUEE"; marquee: Partial<MarqueeSettings> }
	| { type: "SET_VIEWPORT"; zoom: number; panX: number; panY: number }
	| {
			type: "SET_VIEW_OPTS";
			patch: Partial<
				Pick<EditorState, "snapToGrid" | "gridSize" | "showGrid" | "showRulers">
			>;
	  }
	| {
			type: "SET_MISC_TOOL";
			patch: Partial<
				Pick<
					EditorState,
					| "eyedropperSample"
					| "gradientAngle"
					| "gradient"
					| "fillOpacity"
					| "contiguousWand"
					| "textUnderline"
					| "textLineHeight"
				>
			>;
	  }
	| { type: "SET_ZOOM"; zoom: number }
	| { type: "SET_PAN"; panX: number; panY: number }
	| { type: "SET_SELECTION"; selection: Selection | null }
	| { type: "TOGGLE_SELECTION_INVERT" }
	| { type: "SET_CLONE_SOURCE"; point: { x: number; y: number } | null }
	| { type: "PUSH_RECENT_BRUSH" }
	| { type: "SET_LAYERS"; layers: Layer[] }
	| { type: "SET_ACTIVE_LAYER"; id: string }
	| { type: "UPDATE_LAYER"; id: string; patch: Partial<Layer> }
	| {
			type: "ADD_LAYER";
			layer?: Layer;
			name?: string;
			fill?: string;
			insertAboveActive?: boolean;
	  }
	| { type: "DELETE_LAYER"; id: string }
	| { type: "DUPLICATE_LAYER"; id: string }
	| { type: "REORDER_LAYERS"; from: number; to: number }
	| { type: "NEW_DOCUMENT"; width: number; height: number; bg: string }
	| {
			type: "SET_CANVAS_SIZE";
			width: number;
			height: number;
			pushHistory?: boolean;
	  }
	| { type: "PUSH_HISTORY"; description: string }
	| { type: "UNDO" }
	| { type: "REDO" }
	| { type: "JUMP_HISTORY"; index: number }
	| { type: "TOGGLE_GRID" }
	| { type: "TOGGLE_RULERS" }
	| { type: "SET_CLIPBOARD"; data: ImageData | null }
	| { type: "SET_TOLERANCE"; magic?: number; fill?: number }
	| {
			type: "SET_TEXT_OPTS";
			patch: Partial<
				Pick<
					EditorState,
					"textFont" | "textSize" | "textBold" | "textItalic" | "textAlign"
				>
			>;
	  }
	| { type: "ADD_RECENT_COLOR"; color: string }
	| { type: "BUMP_RENDER" }
	| {
			type: "LOAD_PROJECT";
			state: Pick<
				EditorState,
				"layers" | "canvasWidth" | "canvasHeight" | "activeLayerId"
			> & {
				selection?: Selection | null;
				selectionInverted?: boolean;
				canvasBackground?: string;
				view?: {
					zoom: number;
					panX: number;
					panY: number;
					showGrid: boolean;
					showRulers: boolean;
					snapToGrid: boolean;
					gridSize: number;
				};
			};
	  }
	| {
			type: "RESTORE_DRAFT";
			layers: Layer[];
			canvasWidth: number;
			canvasHeight: number;
			canvasBackground: string;
			activeLayerId: string | null;
			tool: ToolName;
			foregroundColor: string;
			backgroundColor: string;
	  }
	| { type: "REQUEST_FIT_TO_SCREEN" };

function pushHistory(state: EditorState, description: string): EditorState {
	const entry: HistoryEntry = {
		layers: state.layers.map(snapshotLayer),
		canvasWidth: state.canvasWidth,
		canvasHeight: state.canvasHeight,
		description,
		selection: state.selection,
	};
	let history = state.history.slice(0, state.historyIndex + 1);
	history.push(entry);
	const maxHistory = getHistoryLimit(
		state.canvasWidth,
		state.canvasHeight,
		state.layers.length,
	);
	if (history.length > maxHistory)
		history = history.slice(history.length - maxHistory);
	return {
		...state,
		history,
		historyIndex: history.length - 1,
		renderTick: state.renderTick + 1,
	};
}

function restoreHistory(state: EditorState, index: number): EditorState {
	const entry = state.history[index];
	if (!entry) return state;
	const layers = entry.layers.map((s) =>
		restoreLayerFromSnapshot(s, entry.canvasWidth, entry.canvasHeight),
	);
	layers.forEach((l) => {
		if (l.type === "text") renderTextLayer(l);
	});
	return {
		...state,
		layers,
		canvasWidth: entry.canvasWidth,
		canvasHeight: entry.canvasHeight,
		selection: entry.selection,
		historyIndex: index,
		renderTick: state.renderTick + 1,
	};
}

function reducer(state: EditorState, action: Action): EditorState {
	switch (action.type) {
		case "SET_TOOL":
			return { ...state, tool: action.tool };
		case "SET_COLORS":
			return {
				...state,
				foregroundColor: action.fg ?? state.foregroundColor,
				backgroundColor: action.bg ?? state.backgroundColor,
			};
		case "SWAP_COLORS":
			return {
				...state,
				foregroundColor: state.backgroundColor,
				backgroundColor: state.foregroundColor,
			};
		case "RESET_COLORS":
			return {
				...state,
				foregroundColor: "#000000",
				backgroundColor: "#ffffff",
			};
		case "SET_BRUSH":
			return { ...state, brush: { ...state.brush, ...action.brush } };
		case "PUSH_RECENT_BRUSH": {
			const next = [
				{ ...state.brush },
				...state.recentBrushes.filter(
					(b) =>
						!(
							b.size === state.brush.size &&
							b.hardness === state.brush.hardness &&
							b.opacity === state.brush.opacity
						),
				),
			].slice(0, 6);
			return { ...state, recentBrushes: next };
		}
		case "SET_CLONE_SOURCE":
			return { ...state, cloneSource: action.point };
		case "SET_SHAPE":
			return { ...state, shape: { ...state.shape, ...action.shape } };
		case "SET_MARQUEE":
			return { ...state, marquee: { ...state.marquee, ...action.marquee } };
		case "SET_VIEWPORT":
			return {
				...state,
				zoom: Math.min(3200, Math.max(5, action.zoom)),
				panX: action.panX,
				panY: action.panY,
			};
		case "SET_VIEW_OPTS":
			return { ...state, ...action.patch };
		case "SET_MISC_TOOL":
			return { ...state, ...action.patch };
		case "SET_ZOOM":
			return { ...state, zoom: Math.min(3200, Math.max(5, action.zoom)) };
		case "SET_PAN":
			return { ...state, panX: action.panX, panY: action.panY };
		case "SET_SELECTION":
			return { ...state, selection: action.selection, selectionInverted: false };
		case "TOGGLE_SELECTION_INVERT":
			if (!state.selection) return state;
			return { ...state, selectionInverted: !state.selectionInverted };
		case "SET_LAYERS":
			return {
				...state,
				layers: action.layers,
				renderTick: state.renderTick + 1,
			};
		case "SET_ACTIVE_LAYER":
			return { ...state, activeLayerId: action.id };
		case "UPDATE_LAYER": {
			const layers = state.layers.map((l) =>
				l.id === action.id ? { ...l, ...action.patch } : l,
			);
			return { ...state, layers, renderTick: state.renderTick + 1 };
		}
		case "ADD_LAYER": {
			const layer =
				action.layer ??
				createLayer(
					state.canvasWidth,
					state.canvasHeight,
					action.name ?? `Layer ${state.layers.length + 1}`,
					action.fill !== undefined ? { fill: action.fill } : undefined,
				);
			const insertAbove = action.insertAboveActive !== false;
			const activeIdx = state.activeLayerId
				? state.layers.findIndex((l) => l.id === state.activeLayerId)
				: -1;
			let layers: Layer[];
			if (insertAbove && activeIdx >= 0) {
				layers = [...state.layers];
				layers.splice(activeIdx + 1, 0, layer);
			} else {
				layers = [...state.layers, layer];
			}
			return pushHistory(
				{ ...state, layers, activeLayerId: layer.id },
				"New Layer",
			);
		}
		case "DELETE_LAYER": {
			if (state.layers.length <= 1) return state;
			const layers = state.layers.filter((l) => l.id !== action.id);
			const activeLayerId =
				state.activeLayerId === action.id
					? layers[layers.length - 1]!.id
					: state.activeLayerId;
			return pushHistory({ ...state, layers, activeLayerId }, "Delete Layer");
		}
		case "DUPLICATE_LAYER": {
			const src = state.layers.find((l) => l.id === action.id);
			if (!src) return state;
			const dup = cloneLayer(src);
			const idx = state.layers.findIndex((l) => l.id === action.id);
			const layers = [...state.layers];
			layers.splice(idx + 1, 0, dup);
			return pushHistory(
				{ ...state, layers, activeLayerId: dup.id },
				"Duplicate Layer",
			);
		}
		case "REORDER_LAYERS": {
			const layers = [...state.layers];
			const [item] = layers.splice(action.from, 1);
			if (!item) return state;
			layers.splice(action.to, 0, item);
			return { ...state, layers, renderTick: state.renderTick + 1 };
		}
		case "NEW_DOCUMENT": {
			const { width, height } = clampDocumentSize(
				action.width,
				action.height,
			);
			const layer = createLayer(width, height, "Layer 1");
			const entry: HistoryEntry = {
				layers: [snapshotLayer(layer)],
				canvasWidth: width,
				canvasHeight: height,
				description: "New Document",
				selection: null,
			};
			return {
				...state,
				layers: [layer],
				activeLayerId: layer.id,
				canvasWidth: width,
				canvasHeight: height,
				canvasBackground: action.bg,
				selection: null,
				history: [entry],
				historyIndex: 0,
				zoom: 100,
				panX: 0,
				panY: 0,
				renderTick: state.renderTick + 1,
				fitRequest: state.fitRequest + 1,
			};
		}
		case "SET_CANVAS_SIZE": {
			const { width, height } = clampDocumentSize(
				action.width,
				action.height,
			);
			const layers = state.layers.map((l) => {
				if (l.canvas.width === width && l.canvas.height === height) return l;
				const nc = document.createElement("canvas");
				nc.width = width;
				nc.height = height;
				const ctx = nc.getContext("2d")!;
				ctx.drawImage(l.canvas, 0, 0);
				return { ...l, canvas: nc };
			});
			const next = {
				...state,
				layers,
				canvasWidth: width,
				canvasHeight: height,
				fitRequest: state.fitRequest + 1,
				renderTick: state.renderTick + 1,
			};
			if (action.pushHistory === false) return next;
			return pushHistory(next, "Canvas Size");
		}
		case "PUSH_HISTORY":
			return pushHistory(state, action.description);
		case "UNDO":
			if (state.historyIndex <= 0) return state;
			return restoreHistory(state, state.historyIndex - 1);
		case "REDO":
			if (state.historyIndex >= state.history.length - 1) return state;
			return restoreHistory(state, state.historyIndex + 1);
		case "JUMP_HISTORY":
			return restoreHistory(state, action.index);
		case "TOGGLE_GRID":
			return { ...state, showGrid: !state.showGrid };
		case "TOGGLE_RULERS":
			return { ...state, showRulers: !state.showRulers };
		case "SET_CLIPBOARD":
			return { ...state, clipboard: action.data };
		case "SET_TOLERANCE":
			return {
				...state,
				magicWandTolerance: action.magic ?? state.magicWandTolerance,
				fillTolerance: action.fill ?? state.fillTolerance,
			};
		case "SET_TEXT_OPTS":
			return { ...state, ...action.patch };
		case "ADD_RECENT_COLOR": {
			const recent = [
				action.color,
				...state.recentColors.filter((c) => c !== action.color),
			].slice(0, 10);
			return { ...state, recentColors: recent };
		}
		case "BUMP_RENDER":
			return { ...state, renderTick: state.renderTick + 1 };
		case "REQUEST_FIT_TO_SCREEN":
			return { ...state, fitRequest: state.fitRequest + 1 };
		case "LOAD_PROJECT": {
			const view = "view" in action.state ? action.state.view : undefined;
			return {
				...state,
				layers: action.state.layers,
				canvasWidth: action.state.canvasWidth,
				canvasHeight: action.state.canvasHeight,
				activeLayerId: action.state.activeLayerId,
				selection:
					"selection" in action.state
						? (action.state.selection ?? null)
						: null,
				selectionInverted:
					"selectionInverted" in action.state
						? Boolean(action.state.selectionInverted)
						: false,
				canvasBackground:
					action.state.canvasBackground ?? state.canvasBackground ?? "#ffffff",
				zoom: view?.zoom ?? state.zoom,
				panX: view?.panX ?? state.panX,
				panY: view?.panY ?? state.panY,
				showGrid: view?.showGrid ?? state.showGrid,
				showRulers: view?.showRulers ?? state.showRulers,
				snapToGrid: view?.snapToGrid ?? state.snapToGrid,
				gridSize: view?.gridSize ?? state.gridSize,
				history: [
					{
						layers: action.state.layers.map(snapshotLayer),
						canvasWidth: action.state.canvasWidth,
						canvasHeight: action.state.canvasHeight,
						description: "Open Project",
						selection:
							"selection" in action.state
								? (action.state.selection ?? null)
								: null,
					},
				],
				historyIndex: 0,
				renderTick: state.renderTick + 1,
				fitRequest: view ? state.fitRequest : state.fitRequest + 1,
			};
		}
		case "RESTORE_DRAFT": {
			const entry: HistoryEntry = {
				layers: action.layers.map(snapshotLayer),
				canvasWidth: action.canvasWidth,
				canvasHeight: action.canvasHeight,
				description: "Restored Draft",
				selection: null,
			};
			return {
				...state,
				layers: action.layers,
				canvasWidth: action.canvasWidth,
				canvasHeight: action.canvasHeight,
				canvasBackground: action.canvasBackground,
				activeLayerId: action.activeLayerId,
				tool: action.tool,
				foregroundColor: action.foregroundColor,
				backgroundColor: action.backgroundColor,
				selection: null,
				history: [entry],
				historyIndex: 0,
				renderTick: state.renderTick + 1,
				fitRequest: state.fitRequest + 1,
			};
		}
		default:
			return state;
	}
}

function createInitialState(): EditorState {
	const layer = createLayer(800, 600, "Layer 1");
	const entry: HistoryEntry = {
		layers: [snapshotLayer(layer)],
		canvasWidth: 800,
		canvasHeight: 600,
		description: "New Document",
		selection: null,
	};
	return {
		layers: [layer],
		activeLayerId: layer.id,
		tool: "brush",
		foregroundColor: "#000000",
		backgroundColor: "#ffffff",
		brush: { ...DEFAULT_BRUSH },
		shape: { ...DEFAULT_SHAPE },
		marquee: { ...DEFAULT_MARQUEE },
		snapToGrid: false,
		gridSize: 20,
		eyedropperSample: 1,
		gradientAngle: 0,
		gradient: {
			...DEFAULT_GRADIENT,
			stops: DEFAULT_GRADIENT.stops.map((s) => ({ ...s })),
		},
		fillOpacity: 100,
		textUnderline: false,
		textLineHeight: 120,
		contiguousWand: true,
		zoom: 100,
		panX: 0,
		panY: 0,
		selection: null,
		selectionInverted: false,
		history: [entry],
		historyIndex: 0,
		canvasWidth: 800,
		canvasHeight: 600,
		canvasBackground: "#ffffff",
		showGrid: false,
		showRulers: false,
		clipboard: null,
		magicWandTolerance: 32,
		fillTolerance: 32,
		textFont: "Inter",
		textSize: 24,
		textBold: false,
		textItalic: false,
		textAlign: "left",
		recentColors: [],
		recentBrushes: [],
		cloneSource: null,
		renderTick: 0,
		fitRequest: 1,
	};
}

export interface AddLayerOptions {
	/** Custom layer instance; skips default empty layer creation. */
	layer?: Layer;
	name?: string;
	/** Solid fill color, e.g. `#ffffff`. Omit for a transparent layer. */
	fill?: string;
	/** When true (default), inserts above the active layer in the stack. */
	insertAboveActive?: boolean;
}

interface EditorContextValue {
	state: EditorState;
	dispatch: React.Dispatch<Action>;
	activeLayer: Layer | undefined;
	commitHistory: (description: string) => void;
	updateActiveLayerCanvas: (
		fn: (ctx: CanvasRenderingContext2D) => void,
	) => void;
	runActiveLayerImageOp: (
		payload: import("@/lib/canvas/imageOpsCore").ImageOpPayload,
		label: string,
	) => Promise<void>;
	addLayer: (options?: AddLayerOptions) => Layer;
	rotateActiveLayer: (deltaDegrees: number) => void;
	setActiveLayerRotation: (degrees: number) => void;
	bakeActiveLayerRotation: () => void;
	draftCache: {
		status: DraftCacheStatus;
		lastSavedAt: number | null;
		pendingDraft: EditorDraftCache | null;
		storageAvailable: boolean;
		restoreDraft: () => Promise<void>;
		discardDraft: () => Promise<void>;
		clearDraftCache: (options?: { silent?: boolean }) => Promise<void>;
	};
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

	const onRestoreDraft = useCallback(
		(draft: EditorDraftCache, layers: Layer[]) => {
			dispatch({
				type: "RESTORE_DRAFT",
				layers,
				canvasWidth: draft.canvasWidth,
				canvasHeight: draft.canvasHeight,
				canvasBackground: draft.canvasBackground,
				activeLayerId: draft.activeLayerId,
				tool: draft.tool,
				foregroundColor: draft.foregroundColor,
				backgroundColor: draft.backgroundColor,
			});
		},
		[dispatch],
	);

	const {
		status: draftStatus,
		lastSavedAt,
		pendingDraft,
		storageAvailable,
		restoreDraft,
		discardDraft,
		clearDraftCache,
	} = useEditorDraftCache(state, onRestoreDraft);

	const draftCache = useMemo(
		() => ({
			status: draftStatus,
			lastSavedAt,
			pendingDraft,
			storageAvailable,
			restoreDraft,
			discardDraft,
			clearDraftCache,
		}),
		[
			draftStatus,
			lastSavedAt,
			pendingDraft,
			storageAvailable,
			restoreDraft,
			discardDraft,
			clearDraftCache,
		],
	);

	const activeLayer = useMemo(
		() => state.layers.find((l) => l.id === state.activeLayerId),
		[state.layers, state.activeLayerId],
	);

	const commitHistory = useCallback((description: string) => {
		dispatch({ type: "PUSH_HISTORY", description });
	}, []);

	const updateActiveLayerCanvas = useCallback(
		(fn: (ctx: CanvasRenderingContext2D) => void) => {
			const layer = state.layers.find((l) => l.id === state.activeLayerId);
			if (!layer || layer.locked) return;
			const ctx = layer.canvas.getContext("2d");
			if (!ctx) return;
			fn(ctx);
			if (layer.type === "text" && layer.textData) renderTextLayer(layer);
			dispatch({ type: "BUMP_RENDER" });
		},
		[state.layers, state.activeLayerId],
	);

	const runActiveLayerImageOp = useCallback(
		async (
			payload: import("@/lib/canvas/imageOpsCore").ImageOpPayload,
			label: string,
		) => {
			const layer = state.layers.find((l) => l.id === state.activeLayerId);
			if (!layer || layer.locked) return;
			const ctx = layer.canvas.getContext("2d");
			if (!ctx) return;
			const { runImageOpOnCanvas } = await import(
				"@/lib/canvas/imageOpsWorker"
			);
			await runImageOpOnCanvas(ctx, payload);
			dispatch({ type: "BUMP_RENDER" });
			dispatch({ type: "PUSH_HISTORY", description: label });
		},
		[state.layers, state.activeLayerId],
	);

	const rotateActiveLayer = useCallback(
		(deltaDegrees: number) => {
			const layer = state.layers.find((l) => l.id === state.activeLayerId);
			if (
				!layer ||
				!canRotateLayer(layer, state.canvasWidth, state.canvasHeight)
			) {
				return;
			}
			const next = rotateLayerBy(layer, deltaDegrees);
			dispatch({
				type: "UPDATE_LAYER",
				id: layer.id,
				patch: { rotation: next.rotation },
			});
			commitHistory(deltaDegrees > 0 ? "Rotate Layer CW" : "Rotate Layer CCW");
		},
		[
			state.layers,
			state.activeLayerId,
			state.canvasWidth,
			state.canvasHeight,
			dispatch,
			commitHistory,
		],
	);

	const setActiveLayerRotation = useCallback(
		(degrees: number) => {
			const layer = state.layers.find((l) => l.id === state.activeLayerId);
			if (
				!layer ||
				!canRotateLayer(layer, state.canvasWidth, state.canvasHeight)
			) {
				return;
			}
			dispatch({
				type: "UPDATE_LAYER",
				id: layer.id,
				patch: { rotation: normalizeAngle(degrees) },
			});
		},
		[
			state.layers,
			state.activeLayerId,
			state.canvasWidth,
			state.canvasHeight,
			dispatch,
		],
	);

	const bakeActiveLayerRotation = useCallback(() => {
		const layer = state.layers.find((l) => l.id === state.activeLayerId);
		if (
			!layer ||
			!canRotateLayer(layer, state.canvasWidth, state.canvasHeight) ||
			!(layer.rotation ?? 0)
		) {
			return;
		}
		const baked = bakeLayerRotation(layer);
		dispatch({
			type: "UPDATE_LAYER",
			id: layer.id,
			patch: {
				canvas: baked.canvas,
				x: baked.x,
				y: baked.y,
				rotation: 0,
			},
		});
		commitHistory("Bake Rotation");
	}, [
		state.layers,
		state.activeLayerId,
		state.canvasWidth,
		state.canvasHeight,
		dispatch,
		commitHistory,
	]);

	const addLayer = useCallback(
		(options?: AddLayerOptions): Layer => {
			const layer =
				options?.layer ??
				createLayer(
					state.canvasWidth,
					state.canvasHeight,
					options?.name ?? `Layer ${state.layers.length + 1}`,
					options?.fill !== undefined ? { fill: options.fill } : undefined,
				);
			dispatch({
				type: "ADD_LAYER",
				layer,
				insertAboveActive: options?.insertAboveActive,
			});
			return layer;
		},
		[state.canvasWidth, state.canvasHeight, state.layers.length, dispatch],
	);

	const value = useMemo(
		() => ({
			state,
			dispatch,
			activeLayer,
			commitHistory,
			updateActiveLayerCanvas,
			runActiveLayerImageOp,
			addLayer,
			rotateActiveLayer,
			setActiveLayerRotation,
			bakeActiveLayerRotation,
			draftCache,
		}),
		[
			state,
			activeLayer,
			commitHistory,
			updateActiveLayerCanvas,
			runActiveLayerImageOp,
			addLayer,
			rotateActiveLayer,
			setActiveLayerRotation,
			bakeActiveLayerRotation,
			draftCache,
		],
	);

	return (
		<EditorContext.Provider value={value}>{children}</EditorContext.Provider>
	);
}

export function useEditor() {
	const ctx = useContext(EditorContext);
	if (!ctx) throw new Error("useEditor must be used within EditorProvider");
	return ctx;
}

export type { Action as EditorAction, BlendMode, Layer, Selection, ToolName };
export {
	createInitialState as createInitialEditorState,
	reducer as editorReducer,
};
