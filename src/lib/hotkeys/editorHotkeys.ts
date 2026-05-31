import type {
	RegisterableHotkey,
	UseHotkeyDefinition,
} from "@tanstack/react-hotkeys";
import type { ToolName } from "@/types/editor";

const TOOL_KEYS: Record<string, ToolName> = {
	v: "move",
	h: "hand",
	m: "marquee-rect",
	o: "marquee-ellipse",
	l: "lasso",
	w: "magic-wand",
	c: "crop",
	b: "brush",
	p: "pencil",
	e: "eraser",
	g: "fill",
	i: "eyedropper",
	t: "text",
	u: "shape-rect",
	n: "shape-line",
	z: "zoom",
};

export interface EditorHotkeyDeps {
	setSpacePan: (value: boolean) => void;
	onSelectAll: () => void;
	onDeselect: () => void;
	onCopy: () => void;
	onPaste: () => void;
	onClear: () => void;
	undo: () => void;
	redo: () => void;
	duplicateLayer: () => void;
	canDuplicateLayer: boolean;
	addLayer: () => void;
	rotateActiveLayer: (delta: number) => void;
	canRotateLayer: boolean;
	brushSize: number;
	setTool: (tool: ToolName) => void;
	setBrushSize: (size: number) => void;
	swapColors: () => void;
	resetColors: () => void;
}

const prevent = { preventDefault: true } as const;

function hk(key: string): RegisterableHotkey {
	return key as RegisterableHotkey;
}

export function buildEditorHotkeyDefinitions(
	deps: EditorHotkeyDeps,
): UseHotkeyDefinition[] {
	const {
		setSpacePan,
		onSelectAll,
		onDeselect,
		onCopy,
		onPaste,
		onClear,
		undo,
		redo,
		duplicateLayer,
		canDuplicateLayer,
		addLayer,
		rotateActiveLayer,
		canRotateLayer,
		brushSize,
		setTool,
		setBrushSize,
		swapColors,
		resetColors,
	} = deps;

	const hotkeys: UseHotkeyDefinition[] = [
		{
			hotkey: "Space",
			callback: () => setSpacePan(true),
			options: { eventType: "keydown", ...prevent },
		},
		{
			hotkey: "Space",
			callback: () => setSpacePan(false),
			options: { eventType: "keyup" },
		},
		{ hotkey: hk("Mod+Shift+N"), callback: () => addLayer(), options: prevent },
		{
			hotkey: hk("Mod+Shift+]"),
			callback: () => rotateActiveLayer(90),
			options: { ...prevent, enabled: canRotateLayer },
		},
		{
			hotkey: hk("Mod+Shift+["),
			callback: () => rotateActiveLayer(-90),
			options: { ...prevent, enabled: canRotateLayer },
		},
		{
			hotkey: "Mod+J",
			callback: () => duplicateLayer(),
			options: { ...prevent, enabled: canDuplicateLayer },
		},
		{ hotkey: "Mod+Z", callback: undo, options: prevent },
		{ hotkey: "Mod+Y", callback: redo, options: prevent },
		{ hotkey: "Mod+Shift+Z", callback: redo, options: prevent },
		{ hotkey: "Mod+D", callback: onDeselect, options: prevent },
		{ hotkey: "Mod+A", callback: onSelectAll, options: prevent },
		{ hotkey: "Mod+C", callback: onCopy, options: prevent },
		{
			hotkey: "Mod+X",
			callback: () => {
				onCopy();
				onClear();
			},
			options: prevent,
		},
		{ hotkey: "Mod+V", callback: onPaste, options: prevent },
		{ hotkey: "Delete", callback: onClear, options: prevent },
		{ hotkey: "Backspace", callback: onClear, options: prevent },
		{ hotkey: "X", callback: swapColors },
		{ hotkey: "D", callback: resetColors },
		{
			hotkey: hk("["),
			callback: () => setBrushSize(Math.max(1, brushSize - 2)),
		},
		{
			hotkey: hk("]"),
			callback: () => setBrushSize(Math.min(500, brushSize + 2)),
		},
		{ hotkey: "Shift+G", callback: () => setTool("gradient") },
		{ hotkey: "Shift+L", callback: () => setTool("polygon-lasso") },
		{ hotkey: "Shift+N", callback: () => setTool("shape-arrow") },
		{ hotkey: "Shift+U", callback: () => setTool("shape-ellipse") },
	];

	for (const [key, tool] of Object.entries(TOOL_KEYS)) {
		hotkeys.push({
			hotkey: hk(key),
			callback: () => setTool(tool),
		});
	}

	return hotkeys;
}
