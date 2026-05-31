import { createFilledLayer } from "@tests/helpers";
import { describe, expect, it } from "vitest";
import {
	createInitialEditorState,
	type EditorAction,
	editorReducer,
} from "@/context/EditorContext";

function reduce(actions: EditorAction[]) {
	let state = createInitialEditorState();
	for (const action of actions) {
		state = editorReducer(state, action);
	}
	return state;
}

describe("editorReducer", () => {
	it("creates a default document with one layer", () => {
		const state = createInitialEditorState();
		expect(state.layers).toHaveLength(1);
		expect(state.canvasWidth).toBe(800);
		expect(state.canvasBackground).toBe("#ffffff");
	});

	it("switches tools and swaps colors", () => {
		const state = reduce([
			{ type: "SET_TOOL", tool: "eraser" },
			{ type: "SWAP_COLORS" },
		]);
		expect(state.tool).toBe("eraser");
		expect(state.foregroundColor).toBe("#ffffff");
		expect(state.backgroundColor).toBe("#000000");
	});

	it("pushes and undoes history", () => {
		const layer = createFilledLayer(50, 50);
		let state = createInitialEditorState();
		state = editorReducer(state, {
			type: "SET_LAYERS",
			layers: [...state.layers, layer],
		});
		state = editorReducer(state, {
			type: "PUSH_HISTORY",
			description: "Add shape",
		});
		expect(state.history).toHaveLength(2);
		state = editorReducer(state, { type: "UNDO" });
		expect(state.historyIndex).toBe(0);
	});

	it("restores drafts with new history", () => {
		const layer = createFilledLayer();
		const state = reduce([
			{
				type: "RESTORE_DRAFT",
				layers: [layer],
				canvasWidth: 400,
				canvasHeight: 300,
				canvasBackground: "#eeeeee",
				activeLayerId: layer.id,
				tool: "move",
				foregroundColor: "#111111",
				backgroundColor: "#222222",
			},
		]);
		expect(state.canvasWidth).toBe(400);
		expect(state.tool).toBe("move");
		expect(state.history).toHaveLength(1);
		expect(state.history[0]?.description).toBe("Restored Draft");
	});

	it("creates a new document with custom size and background", () => {
		const state = reduce([
			{ type: "NEW_DOCUMENT", width: 1920, height: 1080, bg: "#000000" },
		]);
		expect(state.canvasWidth).toBe(1920);
		expect(state.canvasBackground).toBe("#000000");
		expect(state.layers).toHaveLength(1);
		expect(state.layers[0]?.name).toBe("Layer 1");
	});
});
