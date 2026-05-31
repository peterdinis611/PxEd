import { useHotkeys } from "@tanstack/react-hotkeys";
import { useMemo } from "react";
import { useEditor } from "@/context/EditorContext";
import { buildEditorHotkeyDefinitions } from "@/lib/hotkeys/editorHotkeys";
import type { ToolName } from "@/types/editor";

export function useKeyboardShortcuts(
	setSpacePan: (v: boolean) => void,
	onSelectAll: () => void,
	onDeselect: () => void,
	onCopy: () => void,
	onPaste: () => void,
	onClear: () => void,
) {
	const { state, dispatch, addLayer, rotateActiveLayer, activeLayer } =
		useEditor();

	const hotkeys = useMemo(
		() =>
			buildEditorHotkeyDefinitions({
				setSpacePan,
				onSelectAll,
				onDeselect,
				onCopy,
				onPaste,
				onClear,
				undo: () => dispatch({ type: "UNDO" }),
				redo: () => dispatch({ type: "REDO" }),
				duplicateLayer: () => {
					if (state.activeLayerId) {
						dispatch({ type: "DUPLICATE_LAYER", id: state.activeLayerId });
					}
				},
				canDuplicateLayer: !!state.activeLayerId,
				addLayer: () => {
					addLayer();
				},
				rotateActiveLayer,
				canRotateLayer: !!activeLayer && !activeLayer.locked,
				brushSize: state.brush.size,
				setTool: (tool: ToolName) => dispatch({ type: "SET_TOOL", tool }),
				setBrushSize: (size) =>
					dispatch({ type: "SET_BRUSH", brush: { size } }),
				swapColors: () => dispatch({ type: "SWAP_COLORS" }),
				resetColors: () => dispatch({ type: "RESET_COLORS" }),
			}),
		[
			setSpacePan,
			onSelectAll,
			onDeselect,
			onCopy,
			onPaste,
			onClear,
			dispatch,
			addLayer,
			rotateActiveLayer,
			state.activeLayerId,
			activeLayer?.locked,
			state.brush.size,
		],
	);

	useHotkeys(hotkeys, { ignoreInputs: true });
}
