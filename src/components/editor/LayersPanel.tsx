import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { LayerRow } from "@/components/editor/LayerRow";
import { ToolTooltip } from "@/components/editor/ToolTooltip";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/context/EditorContext";

const LAYER_ROW_HEIGHT = 32;

export function LayersPanel() {
	const { state, dispatch, addLayer } = useEditor();
	const [renaming, setRenaming] = useState<string | null>(null);
	const [renameVal, setRenameVal] = useState("");
	const [collapsed, setCollapsed] = useState(false);
	const dragIdx = useRef<number | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);

	const layers = [...state.layers].reverse();

	const virtualizer = useVirtualizer({
		count: layers.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => LAYER_ROW_HEIGHT,
		overscan: 6,
	});

	const startRename = (id: string, name: string) => {
		setRenaming(id);
		setRenameVal(name);
	};

	const commitRename = () => {
		if (renaming && renameVal.trim()) {
			dispatch({
				type: "UPDATE_LAYER",
				id: renaming,
				patch: { name: renameVal.trim() },
			});
		}
		setRenaming(null);
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="panel-header flex items-center justify-between border-b border-[var(--color-editor-border)] px-2 py-1.5">
				<button
					type="button"
					className="interactive inline-flex items-center gap-1 text-[var(--color-editor-muted)] hover:text-[var(--color-editor-text)]"
					onClick={() => setCollapsed((v) => !v)}
				>
					<ChevronDown
						className={`h-3.5 w-3.5 transition-transform ${collapsed ? "-rotate-90" : ""}`}
					/>
					<span>Layers</span>
				</button>
				<span className="text-[10px] tabular-nums text-zinc-600">
					{state.layers.length}
				</span>
			</div>

			{!collapsed && (
				<div
					ref={scrollRef}
					className="smooth-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1.5"
				>
					<div
						className="relative w-full p-1"
						style={{ height: `${virtualizer.getTotalSize()}px` }}
					>
						{virtualizer.getVirtualItems().map((virtualRow) => {
							const layer = layers[virtualRow.index]!;
							const realIdx = state.layers.findIndex((l) => l.id === layer.id);
							const isActive = layer.id === state.activeLayerId;

							return (
								<div
									key={layer.id}
									className="absolute left-0 top-0 w-full px-0"
									style={{
										height: `${virtualRow.size}px`,
										transform: `translateY(${virtualRow.start}px)`,
									}}
								>
									<LayerRow
										layer={layer}
										isActive={isActive}
										renaming={renaming === layer.id}
										renameVal={renameVal}
										onSelect={() =>
											dispatch({ type: "SET_ACTIVE_LAYER", id: layer.id })
										}
										onStartRename={() => startRename(layer.id, layer.name)}
										onRenameChange={setRenameVal}
										onCommitRename={commitRename}
										onToggleVisible={() =>
											dispatch({
												type: "UPDATE_LAYER",
												id: layer.id,
												patch: { visible: !layer.visible },
											})
										}
										onToggleLocked={() =>
											dispatch({
												type: "UPDATE_LAYER",
												id: layer.id,
												patch: { locked: !layer.locked },
											})
										}
										onDragStart={() => {
											dragIdx.current = realIdx;
										}}
										onDragOver={(e) => e.preventDefault()}
										onDrop={() => {
											if (
												dragIdx.current !== null &&
												dragIdx.current !== realIdx
											) {
												dispatch({
													type: "REORDER_LAYERS",
													from: dragIdx.current,
													to: realIdx,
												});
											}
											dragIdx.current = null;
										}}
									/>
								</div>
							);
						})}
					</div>
				</div>
			)}

			<div className="flex gap-0.5 border-t border-[var(--color-editor-border)] px-1 py-1">
				{[
					{
						icon: Plus,
						label: "New layer",
						description: "Adds an empty layer above the current one.",
						onClick: () => addLayer(),
						disabled: false,
					},
					{
						icon: Copy,
						label: "Duplicate",
						description:
							"Creates a copy of the active layer including its content.",
						onClick: () =>
							state.activeLayerId &&
							dispatch({ type: "DUPLICATE_LAYER", id: state.activeLayerId }),
						disabled: !state.activeLayerId,
					},
					{
						icon: Trash2,
						label: "Delete layer",
						description:
							"Removes the active layer. The last layer cannot be deleted.",
						onClick: () =>
							state.activeLayerId &&
							dispatch({ type: "DELETE_LAYER", id: state.activeLayerId }),
						disabled: state.layers.length <= 1,
					},
				].map(({ icon: Icon, label, description, onClick, disabled }) => (
					<ToolTooltip
						key={label}
						label={label}
						description={description}
						side="top"
					>
						<Button
							variant="ghost"
							size="icon"
							className="interactive h-7 w-7 rounded"
							disabled={disabled}
							onClick={onClick}
						>
							<Icon className="h-3.5 w-3.5" />
						</Button>
					</ToolTooltip>
				))}
			</div>
		</div>
	);
}
