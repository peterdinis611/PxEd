import {
	DRAFT_CACHE_VERSION,
	type EditorDraftCache,
	snapshotToCachedLayer,
} from "@/lib/cache/draftStorage";
import { snapshotLayer } from "@/lib/canvas/layers";
import type { Layer, ToolName } from "@/types/editor";

export interface DraftSourceState {
	layers: Layer[];
	canvasWidth: number;
	canvasHeight: number;
	canvasBackground: string;
	activeLayerId: string | null;
	tool: ToolName;
	foregroundColor: string;
	backgroundColor: string;
	renderTick?: number;
}

/** Fields persisted to the local draft cache (excludes pan/zoom/selection). */
export function buildEditorDraft(state: DraftSourceState): EditorDraftCache {
	return {
		version: DRAFT_CACHE_VERSION,
		savedAt: Date.now(),
		canvasWidth: state.canvasWidth,
		canvasHeight: state.canvasHeight,
		canvasBackground: state.canvasBackground,
		activeLayerId: state.activeLayerId,
		layers: state.layers.map((l) => snapshotToCachedLayer(snapshotLayer(l))),
		tool: state.tool,
		foregroundColor: state.foregroundColor,
		backgroundColor: state.backgroundColor,
	};
}
