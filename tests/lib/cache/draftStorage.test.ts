import { createFilledLayer, createTestLayer } from "@tests/helpers";
import { describe, expect, it } from "vitest";
import {
	clearEditorDraft,
	DRAFT_CACHE_VERSION,
	draftHasMeaningfulContent,
	type EditorDraftCache,
	loadEditorDraft,
	saveEditorDraft,
	snapshotToCachedLayer,
} from "@/lib/cache/draftStorage";
import { snapshotLayer } from "@/lib/canvas/layers";

function makeDraft(overrides?: Partial<EditorDraftCache>): EditorDraftCache {
	const layer = createFilledLayer(100, 100, "Layer 1");
	return {
		version: DRAFT_CACHE_VERSION,
		savedAt: Date.now(),
		canvasWidth: 800,
		canvasHeight: 600,
		canvasBackground: "#ffffff",
		activeLayerId: layer.id,
		layers: [snapshotToCachedLayer(snapshotLayer(layer))],
		tool: "brush",
		foregroundColor: "#000000",
		backgroundColor: "#ffffff",
		...overrides,
	};
}

describe("draftHasMeaningfulContent", () => {
	it("returns false for an empty default-sized document", () => {
		const layer = createTestLayer(800, 600, "Layer 1");
		const draft = makeDraft({
			layers: [snapshotToCachedLayer(snapshotLayer(layer))],
		});
		expect(draftHasMeaningfulContent(draft)).toBe(false);
	});

	it("returns true when canvas size differs from default", () => {
		expect(draftHasMeaningfulContent(makeDraft({ canvasWidth: 1920 }))).toBe(
			true,
		);
	});

	it("returns true when there are multiple layers", () => {
		const draft = makeDraft({
			layers: [
				snapshotToCachedLayer(snapshotLayer(createFilledLayer())),
				snapshotToCachedLayer(snapshotLayer(createFilledLayer(50, 50, "L2"))),
			],
		});
		expect(draftHasMeaningfulContent(draft)).toBe(true);
	});
});

describe("IndexedDB draft persistence", () => {
	it("saves and loads a draft", async () => {
		const draft = makeDraft();
		await saveEditorDraft(draft);
		const loaded = await loadEditorDraft();
		expect(loaded?.canvasWidth).toBe(800);
		expect(loaded?.layers).toHaveLength(1);
		expect(loaded?.layers[0]?.name).toBe("Layer 1");
	});

	it("clears stored drafts", async () => {
		await saveEditorDraft(makeDraft());
		await clearEditorDraft();
		expect(await loadEditorDraft()).toBeNull();
	});
});
