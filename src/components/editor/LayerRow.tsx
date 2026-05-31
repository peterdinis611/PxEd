import { Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { useEffect, useRef } from "react";
import { ToolTooltip } from "@/components/editor/ToolTooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Layer } from "@/types/editor";

function LayerThumb({ canvas }: { canvas: HTMLCanvasElement }) {
	const ref = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const max = 28;
		const scale = Math.min(max / canvas.width, max / canvas.height, 1);
		el.width = Math.max(1, canvas.width * scale);
		el.height = Math.max(1, canvas.height * scale);
		el.getContext("2d")?.drawImage(canvas, 0, 0, el.width, el.height);
	}, [canvas]);
	return (
		<canvas
			ref={ref}
			className="h-7 w-7 shrink-0 rounded border border-zinc-700/80 bg-zinc-800"
		/>
	);
}

export function LayerRow({
	layer,
	isActive,
	renaming,
	renameVal,
	onSelect,
	onStartRename,
	onRenameChange,
	onCommitRename,
	onToggleVisible,
	onToggleLocked,
	onDragStart,
	onDragOver,
	onDrop,
}: {
	layer: Layer;
	isActive: boolean;
	renaming: boolean;
	renameVal: string;
	onSelect: () => void;
	onStartRename: () => void;
	onRenameChange: (value: string) => void;
	onCommitRename: () => void;
	onToggleVisible: () => void;
	onToggleLocked: () => void;
	onDragStart: () => void;
	onDragOver: (e: React.DragEvent) => void;
	onDrop: () => void;
}) {
	return (
		<div
			draggable
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDrop={onDrop}
			className={cn(
				"group interactive flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5",
				isActive
					? "bg-blue-500/10 ring-1 ring-inset ring-blue-500/40"
					: "hover:bg-zinc-800",
			)}
			onClick={onSelect}
			onDoubleClick={onStartRename}
		>
			<ToolTooltip
				label={layer.visible ? "Hide layer" : "Show layer"}
				description={
					layer.visible
						? "Layer will not be drawn on the canvas but stays in the list."
						: "Shows the layer on the canvas again."
				}
				side="left"
			>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 shrink-0 opacity-60 group-hover:opacity-100"
					onClick={(e) => {
						e.stopPropagation();
						onToggleVisible();
					}}
				>
					{layer.visible ? (
						<Eye className="h-3.5 w-3.5" />
					) : (
						<EyeOff className="h-3.5 w-3.5 text-zinc-500" />
					)}
				</Button>
			</ToolTooltip>
			<ToolTooltip
				label={layer.locked ? "Unlock layer" : "Lock layer"}
				description={
					layer.locked
						? "Allows editing and painting on this layer."
						: "Prevents painting and edits on this layer."
				}
				side="left"
			>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 shrink-0 opacity-60 group-hover:opacity-100"
					onClick={(e) => {
						e.stopPropagation();
						onToggleLocked();
					}}
				>
					{layer.locked ? (
						<Lock className="h-3.5 w-3.5 text-amber-400/80" />
					) : (
						<Unlock className="h-3.5 w-3.5 text-zinc-500" />
					)}
				</Button>
			</ToolTooltip>
			<LayerThumb canvas={layer.canvas} />
			{renaming ? (
				<Input
					className="h-7 flex-1 text-ui-xs"
					value={renameVal}
					autoFocus
					onChange={(e) => onRenameChange(e.target.value)}
					onBlur={onCommitRename}
					onKeyDown={(e) => e.key === "Enter" && onCommitRename()}
					onClick={(e) => e.stopPropagation()}
				/>
			) : (
				<span className="flex-1 truncate text-ui-xs text-zinc-300">
					{layer.name}
				</span>
			)}
		</div>
	);
}
