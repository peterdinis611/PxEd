import { useCallback, useState } from "react";
import { CanvasArea } from "@/components/editor/CanvasArea";
import { DraftRestoreBanner } from "@/components/editor/DraftRestoreBanner";
import { LayerProperties } from "@/components/editor/LayerProperties";
import { LayersPanel } from "@/components/editor/LayersPanel";
import { MenuBar } from "@/components/editor/MenuBar";
import { OptionsBar } from "@/components/editor/OptionsBar";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { StatusBar } from "@/components/editor/StatusBar";
import { ToolsPanel } from "@/components/editor/ToolsPanel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEditor } from "@/context/EditorContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { selectionBounds } from "@/lib/canvas/selection";

function EditorShell() {
	const {
		state,
		dispatch,
		activeLayer,
		commitHistory,
		updateActiveLayerCanvas,
	} = useEditor();
	const [spacePan, setSpacePan] = useState(false);
	const [cursor, setCursor] = useState({ x: 0, y: 0, rgba: "—" });

	const onSelectAll = useCallback(() => {
		dispatch({
			type: "SET_SELECTION",
			selection: {
				type: "rect",
				x: 0,
				y: 0,
				width: state.canvasWidth,
				height: state.canvasHeight,
			},
		});
	}, [dispatch, state.canvasWidth, state.canvasHeight]);

	const onDeselect = useCallback(() => {
		dispatch({ type: "SET_SELECTION", selection: null });
	}, [dispatch]);

	const onCopy = useCallback(() => {
		const bounds = selectionBounds(state.selection);
		if (!bounds || !activeLayer) return;
		const { x, y, width, height } = bounds;
		const ctx = activeLayer.canvas.getContext("2d")!;
		const data = ctx.getImageData(
			Math.max(0, Math.floor(x)),
			Math.max(0, Math.floor(y)),
			Math.min(width, activeLayer.canvas.width),
			Math.min(height, activeLayer.canvas.height),
		);
		dispatch({ type: "SET_CLIPBOARD", data });
	}, [state.selection, activeLayer, dispatch]);

	const onPaste = useCallback(() => {
		if (!state.clipboard || !activeLayer) return;
		updateActiveLayerCanvas((ctx) => {
			ctx.putImageData(state.clipboard!, 0, 0);
		});
		commitHistory("Paste");
	}, [state.clipboard, activeLayer, updateActiveLayerCanvas, commitHistory]);

	const onDelete = useCallback(() => {
		const bounds = selectionBounds(state.selection);
		if (!bounds || !activeLayer) return;
		updateActiveLayerCanvas((ctx) => {
			ctx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
		});
		commitHistory("Clear Selection");
	}, [state.selection, activeLayer, updateActiveLayerCanvas, commitHistory]);

	useKeyboardShortcuts(
		setSpacePan,
		onSelectAll,
		onDeselect,
		onCopy,
		onPaste,
		onDelete,
	);

	return (
		<div
			className="editor-shell editor-ui fixed inset-0 grid overflow-hidden text-zinc-100"
			style={{
				gridTemplateRows: "28px minmax(0, max-content) minmax(0, 1fr) 24px",
				gridTemplateColumns: "52px minmax(0, 1fr) 272px",
				gridTemplateAreas: `
          "menu menu menu"
          "options options options"
          "tools canvas sidebar"
          "status status status"
        `,
			}}
		>
			<header style={{ gridArea: "menu" }} className="min-h-0 overflow-hidden">
				<MenuBar
					onSelectAll={onSelectAll}
					onDeselect={onDeselect}
					onCopy={onCopy}
					onPaste={onPaste}
					onClear={onDelete}
				/>
			</header>

			<div
				style={{ gridArea: "options" }}
				className="min-h-0 overflow-x-auto overflow-y-hidden"
			>
				<OptionsBar />
			</div>

			<div style={{ gridArea: "tools" }} className="min-h-0 overflow-hidden">
				<ToolsPanel />
			</div>

			<main
				style={{ gridArea: "canvas" }}
				className="relative min-h-0 min-w-0 overflow-hidden"
			>
				<DraftRestoreBanner />
				<CanvasArea
					spacePan={spacePan}
					onCursorMove={(x, y, rgba) => setCursor({ x, y, rgba })}
				/>
			</main>

			<aside
				style={{ gridArea: "sidebar" }}
				className="flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-zinc-800 bg-[var(--color-editor-surface)]"
			>
				<LayersPanel />
				<LayerProperties />
				<PropertiesPanel />
			</aside>

			<footer
				style={{ gridArea: "status" }}
				className="min-h-0 overflow-hidden"
			>
				<StatusBar cursor={cursor} spacePan={spacePan} />
			</footer>
		</div>
	);
}

function EditorApp() {
	return (
		<TooltipProvider delayDuration={300}>
			<EditorShell />
		</TooltipProvider>
	);
}

export { EditorApp };
export default EditorApp;
