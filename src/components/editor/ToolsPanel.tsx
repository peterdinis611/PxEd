import { motion } from "framer-motion";
import {
	ArrowUpRight,
	Blend,
	Brush,
	Circle,
	Crop,
	Eraser,
	Eye,
	Hand,
	Hexagon,
	Lasso,
	Minus,
	MousePointer2,
	PaintBucket,
	Pencil,
	Pentagon,
	Square,
	Type,
	Wand2,
	ZoomIn,
} from "lucide-react";
import { ColorsDock } from "@/components/editor/ColorsDock";
import { ToolTooltip } from "@/components/editor/ToolTooltip";
import { Separator } from "@/components/ui/separator";
import { useEditor } from "@/context/EditorContext";
import { springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ToolName } from "@/types/editor";

const ICON = "h-[15px] w-[15px]";

type ToolDef = {
	id: ToolName;
	icon: React.ReactNode;
	label: string;
	description: string;
	key: string;
};

const TOOL_GROUPS: { label: string; tools: ToolDef[] }[] = [
	{
		label: "Navigate",
		tools: [
			{
				id: "move",
				icon: <MousePointer2 className={ICON} />,
				label: "Move",
				description: "Moves the active layer on the canvas.",
				key: "V",
			},
			{
				id: "hand",
				icon: <Hand className={ICON} />,
				label: "Hand",
				description: "Pans the canvas when you drag. Same as holding Space.",
				key: "H",
			},
			{
				id: "zoom",
				icon: <ZoomIn className={ICON} />,
				label: "Zoom",
				description: "Zooms in or out. Ctrl + scroll wheel also zooms.",
				key: "Z",
			},
		],
	},
	{
		label: "Select",
		tools: [
			{
				id: "marquee-rect",
				icon: <Square className={ICON} />,
				label: "Rect Marquee",
				description: "Creates a rectangular selection.",
				key: "M",
			},
			{
				id: "marquee-ellipse",
				icon: <Circle className={ICON} />,
				label: "Ellipse Marquee",
				description: "Creates an elliptical selection.",
				key: "O",
			},
			{
				id: "lasso",
				icon: <Lasso className={ICON} />,
				label: "Lasso",
				description: "Freehand selection by dragging.",
				key: "L",
			},
			{
				id: "polygon-lasso",
				icon: <Pentagon className={ICON} />,
				label: "Polygon Lasso",
				description: "Click to add points. Click the first point to close.",
				key: "Shift+L",
			},
			{
				id: "magic-wand",
				icon: <Wand2 className={ICON} />,
				label: "Magic Wand",
				description: "Selects similar pixels by color and tolerance.",
				key: "W",
			},
		],
	},
	{
		label: "Transform",
		tools: [
			{
				id: "crop",
				icon: <Crop className={ICON} />,
				label: "Crop",
				description: "Crops the document to the chosen area.",
				key: "C",
			},
		],
	},
	{
		label: "Paint",
		tools: [
			{
				id: "brush",
				icon: <Brush className={ICON} />,
				label: "Brush",
				description: "Soft strokes with adjustable size and hardness.",
				key: "B",
			},
			{
				id: "pencil",
				icon: <Pencil className={ICON} />,
				label: "Pencil",
				description: "Hard pixels without anti-aliasing.",
				key: "P",
			},
			{
				id: "eraser",
				icon: <Eraser className={ICON} />,
				label: "Eraser",
				description: "Erases pixels on the active layer.",
				key: "E",
			},
			{
				id: "fill",
				icon: <PaintBucket className={ICON} />,
				label: "Paint Bucket",
				description: "Fills a contiguous area with the foreground color.",
				key: "G",
			},
			{
				id: "gradient",
				icon: <Blend className={ICON} />,
				label: "Gradient",
				description: "Gradient from foreground to background color.",
				key: "⇧G",
			},
			{
				id: "eyedropper",
				icon: <Eye className={ICON} />,
				label: "Eyedropper",
				description: "Picks color from the pixel under the cursor.",
				key: "I",
			},
		],
	},
	{
		label: "Shapes",
		tools: [
			{
				id: "shape-rect",
				icon: <Square className={ICON} />,
				label: "Rectangle",
				description: "Draws a rectangle or square.",
				key: "U",
			},
			{
				id: "shape-ellipse",
				icon: <Circle className={ICON} />,
				label: "Ellipse",
				description: "Draws an ellipse or circle.",
				key: "Shift+U",
			},
			{
				id: "shape-line",
				icon: <Minus className={ICON} />,
				label: "Line",
				description: "Draws a straight line.",
				key: "N",
			},
			{
				id: "shape-arrow",
				icon: <ArrowUpRight className={ICON} />,
				label: "Arrow",
				description: "Draws a line with an arrowhead.",
				key: "Shift+N",
			},
		],
	},
	{
		label: "Content",
		tools: [
			{
				id: "text",
				icon: <Type className={ICON} />,
				label: "Text",
				description: "Adds text. Click the canvas and type.",
				key: "T",
			},
		],
	},
];

function ToolButton({
	tool,
	active,
	onSelect,
}: {
	tool: ToolDef;
	active: boolean;
	onSelect: () => void;
}) {
	return (
		<ToolTooltip
			label={tool.label}
			description={tool.description}
			shortcut={tool.key || undefined}
		>
			<button
				type="button"
				className={cn(
					"interactive relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded",
					active ? "text-blue-400" : "text-zinc-400 hover:text-zinc-200",
				)}
				onClick={onSelect}
			>
				{active && (
					<motion.span
						layoutId="active-tool-bg"
						className="absolute inset-0 rounded bg-blue-500/15 ring-1 ring-inset ring-blue-500/35"
						transition={springSnappy}
					/>
				)}
				<span className="relative">{tool.icon}</span>
			</button>
		</ToolTooltip>
	);
}

export function ToolsPanel() {
	const { state, dispatch } = useEditor();

	return (
		<aside className="relative flex h-full w-full flex-col border-r border-zinc-800 bg-[var(--color-editor-surface)]">
			<div className="smooth-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1">
				<div className="flex flex-col items-center gap-1 px-1">
					{TOOL_GROUPS.map((group, gi) => (
						<div
							key={group.label}
							className="flex w-full flex-col items-center"
						>
							{gi > 0 && <Separator className="my-1.5 w-6 opacity-40" />}
							<span className="mb-0.5 w-full truncate px-0.5 text-center text-[9px] font-medium uppercase tracking-wider text-zinc-600">
								{group.label}
							</span>
							{group.tools.map((t) => (
								<ToolButton
									key={t.id}
									tool={t}
									active={state.tool === t.id}
									onSelect={() => dispatch({ type: "SET_TOOL", tool: t.id })}
								/>
							))}
						</div>
					))}
				</div>
			</div>

			<Separator className="mx-auto w-6 shrink-0 opacity-40" />

			<div className="shrink-0 py-1">
				<ColorsDock />
			</div>

			<ToolTooltip
				label="Quick pan"
				description="Hold Space and drag to pan without switching tools."
				shortcut="Space"
				side="right"
			>
				<motion.div
					className="flex shrink-0 cursor-default justify-center pb-1.5 pt-0.5 text-zinc-600"
					animate={{ opacity: [0.35, 0.65, 0.35] }}
					transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
				>
					<Hexagon className="h-3.5 w-3.5" strokeWidth={1.5} />
				</motion.div>
			</ToolTooltip>
		</aside>
	);
}
