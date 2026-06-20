import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CanvasArea } from "@/components/editor/CanvasArea";
import { DraftRestoreBanner } from "@/components/editor/DraftRestoreBanner";
import { LayerProperties } from "@/components/editor/LayerProperties";
import { LayersPanel } from "@/components/editor/LayersPanel";
import { MenuBar } from "@/components/editor/MenuBar";
import { OptionsBar } from "@/components/editor/OptionsBar";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { StatusBar } from "@/components/editor/StatusBar";
import { ToolsPanel } from "@/components/editor/ToolsPanel";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEditor } from "@/context/EditorContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { selectionBounds, withSelectionClip } from "@/lib/canvas/selection";

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
	const [sidebarWidth, setSidebarWidth] = useState(300);
	const [showLayerProps, setShowLayerProps] = useState(true);
	const [showAdjustments, setShowAdjustments] = useState(true);
	const sidebarWidthRef = useRef(sidebarWidth);
	const dragSidebarRef = useRef<{
		startX: number;
		startWidth: number;
	} | null>(null);

	useEffect(() => {
		sidebarWidthRef.current = sidebarWidth;
	}, [sidebarWidth]);

	useEffect(() => {
		const raw = window.localStorage.getItem("pxed.sidebar.width");
		if (!raw) return;
		const parsed = Number(raw);
		if (Number.isFinite(parsed)) {
			setSidebarWidth(Math.min(420, Math.max(240, parsed)));
		}
	}, []);

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
		const bounds = selectionBounds(state.selection);
		const px = bounds ? Math.floor(bounds.x) : Math.floor(cursor.x);
		const py = bounds ? Math.floor(bounds.y) : Math.floor(cursor.y);
		const ctx = activeLayer.canvas.getContext("2d")!;
		withSelectionClip(
			ctx,
			state.selection,
			state.canvasWidth,
			state.canvasHeight,
			state.selectionInverted,
			(c) => {
				c.putImageData(state.clipboard!, px, py);
			},
		);
		dispatch({ type: "BUMP_RENDER" });
		commitHistory("Paste");
	}, [
		state.clipboard,
		state.selection,
		state.selectionInverted,
		state.canvasWidth,
		state.canvasHeight,
		activeLayer,
		cursor.x,
		cursor.y,
		dispatch,
		commitHistory,
	]);

	const onDelete = useCallback(() => {
		if (!activeLayer) return;
		const ctx = activeLayer.canvas.getContext("2d")!;
		if (state.selection) {
			withSelectionClip(
				ctx,
				state.selection,
				state.canvasWidth,
				state.canvasHeight,
				state.selectionInverted,
				(c) => {
					c.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
				},
			);
		} else {
			const bounds = selectionBounds(state.selection);
			if (!bounds) return;
			ctx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
		}
		dispatch({ type: "BUMP_RENDER" });
		commitHistory("Clear Selection");
	}, [
		state.selection,
		state.selectionInverted,
		state.canvasWidth,
		state.canvasHeight,
		activeLayer,
		dispatch,
		commitHistory,
	]);

	const onInvertSelection = useCallback(() => {
		dispatch({ type: "TOGGLE_SELECTION_INVERT" });
	}, [dispatch]);

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
				gridTemplateColumns: `52px minmax(0, 1fr) ${sidebarWidth}px`,
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
					onInvertSelection={onInvertSelection}
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
				className="relative flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-zinc-800 bg-[var(--color-editor-surface)]"
			>
				<button
					type="button"
					aria-label="Resize sidebar"
					className="absolute left-0 top-0 z-20 h-full w-2 -translate-x-1/2 cursor-col-resize bg-transparent"
					onMouseDown={(e) => {
						e.preventDefault();
						dragSidebarRef.current = {
							startX: e.clientX,
							startWidth: sidebarWidth,
						};
						const onMove = (ev: MouseEvent) => {
							const drag = dragSidebarRef.current;
							if (!drag) return;
							const next = Math.min(
								420,
								Math.max(240, drag.startWidth - (ev.clientX - drag.startX)),
							);
							setSidebarWidth(next);
						};
						const onUp = () => {
							const drag = dragSidebarRef.current;
							if (drag) {
								window.localStorage.setItem(
									"pxed.sidebar.width",
									String(sidebarWidthRef.current),
								);
							}
							dragSidebarRef.current = null;
							window.removeEventListener("mousemove", onMove);
							window.removeEventListener("mouseup", onUp);
						};
						window.addEventListener("mousemove", onMove);
						window.addEventListener("mouseup", onUp);
					}}
				>
					<span className="sr-only">Resize sidebar</span>
				</button>
				<div className="flex items-center justify-between gap-1 border-b border-zinc-800 px-1 py-1">
					<div className="flex items-center gap-1 text-zinc-500">
						<GripVertical className="h-3.5 w-3.5" />
						<span className="text-[10px] uppercase tracking-wide">Panels</span>
					</div>
					<div className="flex items-center gap-1">
						<Button
							size="sm"
							variant={showLayerProps ? "secondary" : "ghost"}
							className="h-6 px-1.5 text-[10px]"
							onClick={() => setShowLayerProps((v) => !v)}
						>
							Layer
						</Button>
						<Button
							size="sm"
							variant={showAdjustments ? "secondary" : "ghost"}
							className="h-6 px-1.5 text-[10px]"
							onClick={() => setShowAdjustments((v) => !v)}
						>
							Adjust
						</Button>
					</div>
				</div>
				<div className="flex min-h-0 max-h-[42%] shrink-0 flex-col">
					<LayersPanel />
				</div>
				{showLayerProps && <LayerProperties />}
				{showAdjustments && <PropertiesPanel />}
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
			<Toaster />
		</TooltipProvider>
	);
}

export { EditorApp };
export default EditorApp;
