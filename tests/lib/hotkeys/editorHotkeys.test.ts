import { describe, expect, it, vi } from "vitest";
import { buildEditorHotkeyDefinitions } from "@/lib/hotkeys/editorHotkeys";
import type { ToolName } from "@/types/editor";

function createDeps() {
	return {
		setSpacePan: vi.fn(),
		onSelectAll: vi.fn(),
		onDeselect: vi.fn(),
		onCopy: vi.fn(),
		onPaste: vi.fn(),
		onClear: vi.fn(),
		undo: vi.fn(),
		redo: vi.fn(),
		duplicateLayer: vi.fn(),
		canDuplicateLayer: true,
		addLayer: vi.fn(),
		rotateActiveLayer: vi.fn(),
		canRotateLayer: true,
		brushSize: 10,
		setTool: vi.fn(),
		setBrushSize: vi.fn(),
		swapColors: vi.fn(),
		resetColors: vi.fn(),
	};
}

describe("buildEditorHotkeyDefinitions", () => {
	it("registers tool keys and editor shortcuts", () => {
		const defs = buildEditorHotkeyDefinitions(createDeps());
		const hotkeyStrings = defs.map((d) => String(d.hotkey));
		expect(hotkeyStrings).toContain("v");
		expect(hotkeyStrings).toContain("Mod+Z");
		expect(hotkeyStrings).toContain("Space");
	});

	it("invokes undo when Mod+Z callback runs", () => {
		const deps = createDeps();
		const defs = buildEditorHotkeyDefinitions(deps);
		const undo = defs.find((d) => String(d.hotkey) === "Mod+Z");
		undo?.callback({} as KeyboardEvent, {} as never);
		expect(deps.undo).toHaveBeenCalledOnce();
	});

	it("invokes setTool for brush shortcut", () => {
		const deps = createDeps();
		const defs = buildEditorHotkeyDefinitions(deps);
		const brush = defs.find((d) => String(d.hotkey) === "b");
		brush?.callback({} as KeyboardEvent, {} as never);
		expect(deps.setTool).toHaveBeenCalledWith("brush" satisfies ToolName);
	});

	it("adjusts brush size with bracket keys", () => {
		const deps = createDeps();
		const defs = buildEditorHotkeyDefinitions(deps);
		const grow = defs.find((d) => String(d.hotkey) === "]");
		grow?.callback({} as KeyboardEvent, {} as never);
		expect(deps.setBrushSize).toHaveBeenCalledWith(12);
	});
});
