import { createLayerCanvas, renderTextLayer } from "@/lib/canvas/layers";
import type { Layer, LayerSnapshot, ToolName } from "@/types/editor";

const DB_NAME = "pxed-cache";
const DB_VERSION = 1;
const STORE = "drafts";
const DRAFT_KEY = "current";

export const DRAFT_CACHE_VERSION = 1 as const;

/** Serializable layer pixels (ImageData → PNG data URL). */
export interface CachedLayerSnapshot {
	id: string;
	name: string;
	visible: boolean;
	locked: boolean;
	opacity: number;
	blendMode: LayerSnapshot["blendMode"];
	x: number;
	y: number;
	rotation: number;
	type: LayerSnapshot["type"];
	textData?: LayerSnapshot["textData"];
	width: number;
	height: number;
	pixels: string;
}

export interface EditorDraftCache {
	version: typeof DRAFT_CACHE_VERSION;
	savedAt: number;
	canvasWidth: number;
	canvasHeight: number;
	canvasBackground: string;
	activeLayerId: string | null;
	layers: CachedLayerSnapshot[];
	tool: ToolName;
	foregroundColor: string;
	backgroundColor: string;
}

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onerror = () =>
			reject(request.error ?? new Error("IndexedDB open failed"));
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE);
			}
		};
	});
}

function withStore<T>(
	mode: IDBTransactionMode,
	fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
	return openDb().then(
		(db) =>
			new Promise<T>((resolve, reject) => {
				const tx = db.transaction(STORE, mode);
				const store = tx.objectStore(STORE);
				const request = fn(store);
				request.onsuccess = () => resolve(request.result as T);
				request.onerror = () =>
					reject(request.error ?? new Error("IndexedDB request failed"));
				tx.oncomplete = () => db.close();
				tx.onerror = () =>
					reject(tx.error ?? new Error("IndexedDB transaction failed"));
			}),
	);
}

export function isDraftStorageAvailable(): boolean {
	return typeof indexedDB !== "undefined";
}

export async function saveEditorDraft(draft: EditorDraftCache): Promise<void> {
	if (!isDraftStorageAvailable()) return;
	await withStore("readwrite", (store) => store.put(draft, DRAFT_KEY));
}

export async function loadEditorDraft(): Promise<EditorDraftCache | null> {
	if (!isDraftStorageAvailable()) return null;
	const draft = await withStore<EditorDraftCache | undefined>(
		"readonly",
		(store) => store.get(DRAFT_KEY),
	);
	if (!draft || draft.version !== DRAFT_CACHE_VERSION) return null;
	return draft;
}

export async function clearEditorDraft(): Promise<void> {
	if (!isDraftStorageAvailable()) return;
	await withStore("readwrite", (store) => store.delete(DRAFT_KEY));
}

export function snapshotToCachedLayer(
	snap: LayerSnapshot,
): CachedLayerSnapshot {
	const canvas = document.createElement("canvas");
	canvas.width = snap.imageData.width;
	canvas.height = snap.imageData.height;
	canvas.getContext("2d")!.putImageData(snap.imageData, 0, 0);
	return {
		id: snap.id,
		name: snap.name,
		visible: snap.visible,
		locked: snap.locked,
		opacity: snap.opacity,
		blendMode: snap.blendMode,
		x: snap.x,
		y: snap.y,
		rotation: snap.rotation,
		type: snap.type,
		textData: snap.textData ? { ...snap.textData } : undefined,
		width: snap.imageData.width,
		height: snap.imageData.height,
		pixels: canvas.toDataURL("image/png"),
	};
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () =>
			reject(new Error("Failed to decode cached layer image"));
		img.src = src;
	});
}

export async function cachedLayerToLayer(
	snap: CachedLayerSnapshot,
): Promise<Layer> {
	const img = await loadImage(snap.pixels);
	const canvas = createLayerCanvas(snap.width, snap.height);
	canvas.getContext("2d")!.drawImage(img, 0, 0);
	const layer: Layer = {
		id: snap.id,
		name: snap.name,
		visible: snap.visible,
		locked: snap.locked,
		opacity: snap.opacity,
		blendMode: snap.blendMode,
		canvas,
		x: snap.x,
		y: snap.y,
		rotation: snap.rotation,
		type: snap.type,
		textData: snap.textData ? { ...snap.textData } : undefined,
	};
	if (layer.type === "text") renderTextLayer(layer);
	return layer;
}

export async function layersFromDraft(
	draft: EditorDraftCache,
): Promise<Layer[]> {
	return Promise.all(draft.layers.map(cachedLayerToLayer));
}

export function draftHasMeaningfulContent(draft: EditorDraftCache): boolean {
	if (draft.layers.length > 1) return true;
	if (draft.canvasWidth !== 800 || draft.canvasHeight !== 600) return true;
	const layer = draft.layers[0];
	if (!layer) return false;
	return layer.pixels.length > 500;
}
