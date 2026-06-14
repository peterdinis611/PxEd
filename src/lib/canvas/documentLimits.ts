/** Limits tuned for browser canvas memory (RGBA layers + undo snapshots). */
export const DOC_LIMITS = {
	MAX_EDGE_PX: 8192,
	MAX_MEGAPIXELS: 32,
	SOFT_MEGAPIXELS: 12,
	/** Skip IndexedDB autosave above this total uncompressed layer payload. */
	AUTOSAVE_MAX_LAYER_BYTES: 80 * 1024 * 1024,
	HISTORY_MEMORY_BUDGET_BYTES: 200 * 1024 * 1024,
	MIN_HISTORY_STEPS: 5,
	MAX_HISTORY_STEPS: 50,
	AUTOSAVE_MS_DEFAULT: 2000,
	AUTOSAVE_MS_LARGE: 10_000,
	AUTOSAVE_MS_HUGE: 30_000,
} as const;

export interface DocumentSize {
	width: number;
	height: number;
}

export interface DocumentProfile {
	width: number;
	height: number;
	megapixels: number;
	layerCount: number;
	historyLimit: number;
	autosaveDelayMs: number;
	autosaveEnabled: boolean;
	isLarge: boolean;
	estimatedLayerBytes: number;
}

export function megapixels(width: number, height: number): number {
	return (Math.max(0, width) * Math.max(0, height)) / 1_000_000;
}

export function clampDocumentSize(
	width: number,
	height: number,
): DocumentSize & { clamped: boolean; reason?: string } {
	let w = Math.max(1, Math.floor(width));
	let h = Math.max(1, Math.floor(height));
	let clamped = false;
	const reasons: string[] = [];

	if (w > DOC_LIMITS.MAX_EDGE_PX || h > DOC_LIMITS.MAX_EDGE_PX) {
		const scale = DOC_LIMITS.MAX_EDGE_PX / Math.max(w, h);
		w = Math.max(1, Math.floor(w * scale));
		h = Math.max(1, Math.floor(h * scale));
		clamped = true;
		reasons.push(`max edge ${DOC_LIMITS.MAX_EDGE_PX}px`);
	}

	const mp = megapixels(w, h);
	if (mp > DOC_LIMITS.MAX_MEGAPIXELS) {
		const scale = Math.sqrt(DOC_LIMITS.MAX_MEGAPIXELS / mp);
		w = Math.max(1, Math.floor(w * scale));
		h = Math.max(1, Math.floor(h * scale));
		clamped = true;
		reasons.push(`max ${DOC_LIMITS.MAX_MEGAPIXELS} MP`);
	}

	return {
		width: w,
		height: h,
		clamped,
		reason: reasons.length ? reasons.join(", ") : undefined,
	};
}

/** Fit dimensions inside limits while preserving aspect ratio. */
export function fitWithinDocumentLimits(
	width: number,
	height: number,
): DocumentSize & { scaled: boolean; reason?: string } {
	const clamped = clampDocumentSize(width, height);
	return {
		width: clamped.width,
		height: clamped.height,
		scaled: clamped.clamped,
		reason: clamped.reason,
	};
}

export function estimateLayerBytes(
	width: number,
	height: number,
	layerCount: number,
): number {
	return Math.max(0, width) * Math.max(0, height) * 4 * Math.max(1, layerCount);
}

export function getHistoryLimit(
	width: number,
	height: number,
	layerCount: number,
): number {
	const bytesPerStep = estimateLayerBytes(width, height, layerCount);
	if (bytesPerStep <= 0) return DOC_LIMITS.MAX_HISTORY_STEPS;

	const byBudget = Math.floor(
		DOC_LIMITS.HISTORY_MEMORY_BUDGET_BYTES / bytesPerStep,
	);

	return Math.max(
		1,
		Math.min(DOC_LIMITS.MAX_HISTORY_STEPS, byBudget),
	);
}

export function getAutosaveDelayMs(
	width: number,
	height: number,
	layerCount: number,
): number {
	const mp = megapixels(width, height);
	const layerBytes = estimateLayerBytes(width, height, layerCount);

	if (layerBytes > DOC_LIMITS.AUTOSAVE_MAX_LAYER_BYTES || mp >= 24) {
		return DOC_LIMITS.AUTOSAVE_MS_HUGE;
	}
	if (mp >= DOC_LIMITS.SOFT_MEGAPIXELS || layerCount >= 6) {
		return DOC_LIMITS.AUTOSAVE_MS_LARGE;
	}
	return DOC_LIMITS.AUTOSAVE_MS_DEFAULT;
}

export function shouldSkipAutosave(
	width: number,
	height: number,
	layerCount: number,
): boolean {
	return (
		estimateLayerBytes(width, height, layerCount) >
		DOC_LIMITS.AUTOSAVE_MAX_LAYER_BYTES
	);
}

export function getDocumentProfile(
	width: number,
	height: number,
	layerCount: number,
): DocumentProfile {
	const mp = megapixels(width, height);
	const estimatedLayerBytes = estimateLayerBytes(width, height, layerCount);
	return {
		width,
		height,
		megapixels: mp,
		layerCount,
		historyLimit: getHistoryLimit(width, height, layerCount),
		autosaveDelayMs: getAutosaveDelayMs(width, height, layerCount),
		autosaveEnabled: !shouldSkipAutosave(width, height, layerCount),
		isLarge: mp >= DOC_LIMITS.SOFT_MEGAPIXELS,
		estimatedLayerBytes,
	};
}

export function formatMegapixels(mp: number): string {
	if (mp >= 10) return `${mp.toFixed(1)} MP`;
	if (mp >= 1) return `${mp.toFixed(2)} MP`;
	return `${Math.round(mp * 1000)} KP`;
}
