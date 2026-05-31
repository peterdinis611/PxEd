import { useEffect, useRef, useState } from "react";
import type { MenuDefinition, MenuItem } from "@/components/editor/menuItems";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useEditor } from "@/context/EditorContext";
import { grayscale, invertColors } from "@/lib/canvas/adjustments";
import {
	exportFlattenedPng,
	exportJpeg,
	exportProjectJson,
	parseProjectJson,
	restoreProject,
} from "@/lib/canvas/export";
import { toast } from "@/lib/toast";
import {
	addNoise,
	emboss,
	gaussianBlur,
	pixelate,
	sharpen,
} from "@/lib/canvas/filters";
import { createLayer } from "@/lib/canvas/layers";
import { drawLayerWithTransform } from "@/lib/canvas/transform";
import type { ToolName } from "@/types/editor";

const SHORTCUT_GROUPS: { title: string; rows: [string, string][] }[] = [
	{
		title: "File",
		rows: [
			["New document", "Ctrl+N"],
			["Open image", "Ctrl+O"],
			["New layer", "Ctrl+Shift+N"],
		],
	},
	{
		title: "Edit",
		rows: [
			["Undo / Redo", "Ctrl+Z / Ctrl+Y"],
			["Copy / Paste", "Ctrl+C / Ctrl+V"],
			["Select all / Deselect", "Ctrl+A / Ctrl+D"],
			["Clear selection", "Delete"],
			["Rotate layer 90°", "Ctrl+Shift+[ / Ctrl+Shift+]"],
			["Swap / Default colors", "X / D"],
		],
	},
	{
		title: "Layer",
		rows: [
			["Duplicate layer", "Ctrl+J"],
			["Rotate object (active layer)", "Layer panel or Edit menu"],
		],
	},
	{
		title: "Tools",
		rows: [
			["Move", "V"],
			["Marquee", "M"],
			["Lasso", "L"],
			["Magic wand", "W"],
			["Crop", "C"],
			["Brush / Pencil", "B / P"],
			["Eraser", "E"],
			["Paint bucket", "G"],
			["Gradient", "Shift+G"],
			["Eyedropper", "I"],
			["Text", "T"],
			["Rectangle", "U"],
			["Ellipse marquee", "O"],
			["Line / Arrow", "N / ⇧N"],
			["Polygon lasso", "⇧L"],
			["Hand (pan)", "H"],
			["Zoom", "Z"],
			["Pan canvas", "Space + drag"],
			["Brush size", "[ / ]"],
		],
	},
	{
		title: "View",
		rows: [["Zoom canvas", "Ctrl + scroll"]],
	},
];

export interface MenuBarProps {
	onSelectAll: () => void;
	onDeselect: () => void;
	onCopy: () => void;
	onPaste: () => void;
	onClear: () => void;
}

export function MenuBar({
	onSelectAll,
	onDeselect,
	onCopy,
	onPaste,
	onClear,
}: MenuBarProps) {
	const {
		state,
		dispatch,
		commitHistory,
		updateActiveLayerCanvas,
		addLayer,
		rotateActiveLayer,
		bakeActiveLayerRotation,
		draftCache,
	} = useEditor();
	const fileRef = useRef<HTMLInputElement>(null);
	const openRef = useRef<HTMLInputElement>(null);

	const [newOpen, setNewOpen] = useState(false);
	const [newW, setNewW] = useState(800);
	const [newH, setNewH] = useState(600);
	const [newBg, setNewBg] = useState("#ffffff");

	const [jpegOpen, setJpegOpen] = useState(false);
	const [jpegQ, setJpegQ] = useState(90);

	const [filterOpen, setFilterOpen] = useState<string | null>(null);
	const [filterVal, setFilterVal] = useState(5);

	const [canvasSizeOpen, setCanvasSizeOpen] = useState(false);
	const [cw, setCw] = useState(state.canvasWidth);
	const [ch, setCh] = useState(state.canvasHeight);

	const [helpOpen, setHelpOpen] = useState(false);

	const activeLayer = state.layers.find((l) => l.id === state.activeLayerId);
	const activeIdx = state.activeLayerId
		? state.layers.findIndex((l) => l.id === state.activeLayerId)
		: -1;
	const canDeleteLayer = state.layers.length > 1;
	const canMergeDown = activeIdx > 0;
	const canPaste = !!state.clipboard && !!activeLayer;
	const hasSelection = !!state.selection;

	const applyFilter = (
		fn: (ctx: CanvasRenderingContext2D) => void,
		name: string,
	) => {
		updateActiveLayerCanvas(fn);
		commitHistory(name);
		setFilterOpen(null);
	};

	const setTool = (tool: ToolName) => dispatch({ type: "SET_TOOL", tool });

	const toggleActiveLayer = (patch: {
		visible?: boolean;
		locked?: boolean;
	}) => {
		if (!state.activeLayerId) return;
		dispatch({ type: "UPDATE_LAYER", id: state.activeLayerId, patch });
		commitHistory(
			patch.visible !== undefined
				? patch.visible
					? "Show Layer"
					: "Hide Layer"
				: patch.locked
					? "Lock Layer"
					: "Unlock Layer",
		);
	};

	const flatten = () => {
		const canvas = document.createElement("canvas");
		canvas.width = state.canvasWidth;
		canvas.height = state.canvasHeight;
		const ctx = canvas.getContext("2d")!;
		for (const layer of state.layers) {
			if (!layer.visible) continue;
			ctx.save();
			ctx.globalAlpha = layer.opacity / 100;
			drawLayerWithTransform(ctx, layer);
			ctx.restore();
		}
		const flat = createLayer(
			state.canvasWidth,
			state.canvasHeight,
			"Flattened",
		);
		flat.canvas.getContext("2d")!.drawImage(canvas, 0, 0);
		dispatch({ type: "SET_LAYERS", layers: [flat] });
		dispatch({ type: "SET_ACTIVE_LAYER", id: flat.id });
		commitHistory("Flatten Image");
	};

	const flip = (axis: "h" | "v") => {
		state.layers.forEach((l) => {
			const ctx = l.canvas.getContext("2d")!;
			const temp = document.createElement("canvas");
			temp.width = l.canvas.width;
			temp.height = l.canvas.height;
			const tctx = temp.getContext("2d")!;
			tctx.save();
			if (axis === "h") {
				tctx.translate(l.canvas.width, 0);
				tctx.scale(-1, 1);
			} else {
				tctx.translate(0, l.canvas.height);
				tctx.scale(1, -1);
			}
			tctx.drawImage(l.canvas, 0, 0);
			tctx.restore();
			ctx.clearRect(0, 0, l.canvas.width, l.canvas.height);
			ctx.drawImage(temp, 0, 0);
		});
		dispatch({ type: "BUMP_RENDER" });
		commitHistory(axis === "h" ? "Flip Horizontal" : "Flip Vertical");
	};

	const mergeDown = () => {
		const idx = state.layers.findIndex((l) => l.id === state.activeLayerId);
		if (idx <= 0) return;
		const below = state.layers[idx - 1]!;
		const above = state.layers[idx]!;
		const ctx = below.canvas.getContext("2d")!;
		ctx.save();
		ctx.globalAlpha = above.opacity / 100;
		drawLayerWithTransform(ctx, above);
		ctx.restore();
		const layers = state.layers.filter((l) => l.id !== above.id);
		dispatch({ type: "SET_LAYERS", layers });
		dispatch({ type: "SET_ACTIVE_LAYER", id: below.id });
		commitHistory("Merge Down");
	};

	const menus: MenuDefinition[] = [
		{
			label: "File",
			items: [
				{
					type: "item",
					label: "New...",
					action: () => setNewOpen(true),
					shortcut: "Ctrl+N",
				},
				{
					type: "item",
					label: "Open Image...",
					action: () => openRef.current?.click(),
					shortcut: "Ctrl+O",
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Save as PNG",
					action: () => {
						try {
							exportFlattenedPng(
								state.layers,
								state.canvasWidth,
								state.canvasHeight,
							);
							toast.exportSaved("image.png");
						} catch {
							toast.error("PNG export failed");
						}
					},
				},
				{
					type: "item",
					label: "Save as JPEG...",
					action: () => setJpegOpen(true),
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Export Project (JSON)...",
					action: () => {
						try {
							exportProjectJson(
								state.layers,
								state.canvasWidth,
								state.canvasHeight,
								state.activeLayerId,
							);
							toast.exportSaved("project.pxed.json");
						} catch {
							toast.error("Project export failed");
						}
					},
				},
				{
					type: "item",
					label: "Open Project (JSON)...",
					action: () => fileRef.current?.click(),
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Clear Autosaved Draft",
					action: () => void draftCache.clearDraftCache(),
					disabled: !draftCache.storageAvailable,
				},
			],
		},
		{
			label: "Edit",
			items: [
				{
					type: "item",
					label: "Undo",
					action: () => dispatch({ type: "UNDO" }),
					shortcut: "Ctrl+Z",
				},
				{
					type: "item",
					label: "Redo",
					action: () => dispatch({ type: "REDO" }),
					shortcut: "Ctrl+Y",
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Cut",
					action: () => {
						onCopy();
						onClear();
					},
					shortcut: "Ctrl+X",
					disabled: !hasSelection,
				},
				{
					type: "item",
					label: "Copy",
					action: onCopy,
					shortcut: "Ctrl+C",
					disabled: !hasSelection,
				},
				{
					type: "item",
					label: "Paste",
					action: onPaste,
					shortcut: "Ctrl+V",
					disabled: !canPaste,
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Select All",
					action: onSelectAll,
					shortcut: "Ctrl+A",
				},
				{
					type: "item",
					label: "Deselect",
					action: onDeselect,
					shortcut: "Ctrl+D",
				},
				{
					type: "item",
					label: "Clear Selection",
					action: onClear,
					shortcut: "Del",
					disabled: !hasSelection,
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Rotate Layer 90° CW",
					action: () => rotateActiveLayer(90),
					shortcut: "Ctrl+Shift+]",
					disabled: !activeLayer || activeLayer.locked,
				},
				{
					type: "item",
					label: "Rotate Layer 90° CCW",
					action: () => rotateActiveLayer(-90),
					shortcut: "Ctrl+Shift+[",
					disabled: !activeLayer || activeLayer.locked,
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Swap Colors",
					action: () => dispatch({ type: "SWAP_COLORS" }),
					shortcut: "X",
				},
				{
					type: "item",
					label: "Reset Colors",
					action: () => dispatch({ type: "RESET_COLORS" }),
					shortcut: "D",
				},
			],
		},
		{
			label: "Select",
			items: [
				{
					type: "item",
					label: "Select All",
					action: onSelectAll,
					shortcut: "Ctrl+A",
				},
				{
					type: "item",
					label: "Deselect",
					action: onDeselect,
					shortcut: "Ctrl+D",
				},
				{
					type: "item",
					label: "Clear Selection",
					action: onClear,
					shortcut: "Del",
					disabled: !hasSelection,
				},
			],
		},
		{
			label: "Layer",
			items: [
				{
					type: "item",
					label: "New Layer",
					action: () => addLayer(),
					shortcut: "Ctrl+Shift+N",
				},
				{
					type: "item",
					label: "New Layer (White Fill)",
					action: () => addLayer({ fill: "#ffffff" }),
				},
				{
					type: "item",
					label: "Duplicate Layer",
					action: () =>
						state.activeLayerId &&
						dispatch({ type: "DUPLICATE_LAYER", id: state.activeLayerId }),
					shortcut: "Ctrl+J",
					disabled: !state.activeLayerId,
				},
				{
					type: "item",
					label: "Delete Layer",
					action: () =>
						state.activeLayerId &&
						dispatch({ type: "DELETE_LAYER", id: state.activeLayerId }),
					disabled: !canDeleteLayer,
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Merge Down",
					action: mergeDown,
					disabled: !canMergeDown,
				},
				{ type: "separator" },
				{
					type: "item",
					label: activeLayer?.visible ? "Hide Layer" : "Show Layer",
					action: () => toggleActiveLayer({ visible: !activeLayer?.visible }),
					disabled: !activeLayer,
				},
				{
					type: "item",
					label: activeLayer?.locked ? "Unlock Layer" : "Lock Layer",
					action: () => toggleActiveLayer({ locked: !activeLayer?.locked }),
					disabled: !activeLayer,
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Rotate Object 90° CW",
					action: () => rotateActiveLayer(90),
					disabled: !activeLayer || activeLayer.locked,
				},
				{
					type: "item",
					label: "Rotate Object 90° CCW",
					action: () => rotateActiveLayer(-90),
					disabled: !activeLayer || activeLayer.locked,
				},
				{
					type: "item",
					label: "Bake Rotation to Pixels",
					action: bakeActiveLayerRotation,
					disabled:
						!activeLayer || activeLayer.locked || !(activeLayer.rotation ?? 0),
				},
			],
		},
		{
			label: "Image",
			items: [
				{
					type: "item",
					label: "Canvas Size...",
					action: () => {
						setCw(state.canvasWidth);
						setCh(state.canvasHeight);
						setCanvasSizeOpen(true);
					},
				},
				{ type: "item", label: "Flip Horizontal", action: () => flip("h") },
				{ type: "item", label: "Flip Vertical", action: () => flip("v") },
				{ type: "separator" },
				{ type: "item", label: "Flatten Image", action: flatten },
			],
		},
		{
			label: "Filter",
			items: [
				{
					type: "item",
					label: "Gaussian Blur...",
					action: () => {
						setFilterVal(5);
						setFilterOpen("blur");
					},
				},
				{
					type: "item",
					label: "Sharpen",
					action: () => applyFilter(sharpen, "Sharpen"),
				},
				{
					type: "item",
					label: "Add Noise...",
					action: () => {
						setFilterVal(25);
						setFilterOpen("noise");
					},
				},
				{
					type: "item",
					label: "Pixelate...",
					action: () => {
						setFilterVal(8);
						setFilterOpen("pixelate");
					},
				},
				{
					type: "item",
					label: "Emboss",
					action: () => applyFilter(emboss, "Emboss"),
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Grayscale",
					action: () => applyFilter(grayscale, "Grayscale"),
				},
				{
					type: "item",
					label: "Invert Colors",
					action: () => applyFilter(invertColors, "Invert"),
				},
			],
		},
		{
			label: "Tools",
			items: [
				{
					type: "item",
					label: "Move Tool",
					action: () => setTool("move"),
					shortcut: "V",
				},
				{
					type: "item",
					label: "Hand (Pan)",
					action: () => setTool("hand"),
					shortcut: "H",
				},
				{
					type: "item",
					label: "Rectangular Marquee",
					action: () => setTool("marquee-rect"),
					shortcut: "M",
				},
				{
					type: "item",
					label: "Elliptical Marquee",
					action: () => setTool("marquee-ellipse"),
					shortcut: "O",
				},
				{
					type: "item",
					label: "Lasso",
					action: () => setTool("lasso"),
					shortcut: "L",
				},
				{
					type: "item",
					label: "Polygon Lasso",
					action: () => setTool("polygon-lasso"),
					shortcut: "⇧L",
				},
				{
					type: "item",
					label: "Magic Wand",
					action: () => setTool("magic-wand"),
					shortcut: "W",
				},
				{
					type: "item",
					label: "Crop",
					action: () => setTool("crop"),
					shortcut: "C",
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Brush",
					action: () => setTool("brush"),
					shortcut: "B",
				},
				{
					type: "item",
					label: "Pencil",
					action: () => setTool("pencil"),
					shortcut: "P",
				},
				{
					type: "item",
					label: "Eraser",
					action: () => setTool("eraser"),
					shortcut: "E",
				},
				{
					type: "item",
					label: "Paint Bucket",
					action: () => setTool("fill"),
					shortcut: "G",
				},
				{
					type: "item",
					label: "Gradient",
					action: () => setTool("gradient"),
					shortcut: "⇧G",
				},
				{
					type: "item",
					label: "Eyedropper",
					action: () => setTool("eyedropper"),
					shortcut: "I",
				},
				{ type: "separator" },
				{
					type: "item",
					label: "Text",
					action: () => setTool("text"),
					shortcut: "T",
				},
				{
					type: "item",
					label: "Rectangle",
					action: () => setTool("shape-rect"),
					shortcut: "U",
				},
				{
					type: "item",
					label: "Ellipse",
					action: () => setTool("shape-ellipse"),
					shortcut: "⇧U",
				},
				{
					type: "item",
					label: "Line",
					action: () => setTool("shape-line"),
					shortcut: "N",
				},
				{
					type: "item",
					label: "Arrow",
					action: () => setTool("shape-arrow"),
					shortcut: "⇧N",
				},
				{
					type: "item",
					label: "Zoom",
					action: () => setTool("zoom"),
					shortcut: "Z",
				},
			],
		},
		{
			label: "View",
			items: [
				{
					type: "item",
					label: "Fit to Screen",
					action: () => dispatch({ type: "REQUEST_FIT_TO_SCREEN" }),
				},
				{
					type: "item",
					label: "Zoom In",
					action: () => dispatch({ type: "SET_ZOOM", zoom: state.zoom + 25 }),
				},
				{
					type: "item",
					label: "Zoom Out",
					action: () => dispatch({ type: "SET_ZOOM", zoom: state.zoom - 25 }),
				},
				{
					type: "item",
					label: "Zoom 50%",
					action: () => dispatch({ type: "SET_ZOOM", zoom: 50 }),
				},
				{
					type: "item",
					label: "Zoom 100%",
					action: () => dispatch({ type: "SET_ZOOM", zoom: 100 }),
				},
				{
					type: "item",
					label: "Zoom 200%",
					action: () => dispatch({ type: "SET_ZOOM", zoom: 200 }),
				},
				{ type: "separator" },
				{
					type: "item",
					label: state.showGrid ? "Hide Grid" : "Show Grid",
					action: () => dispatch({ type: "TOGGLE_GRID" }),
				},
				{
					type: "item",
					label: state.showRulers ? "Hide Rulers" : "Show Rulers",
					action: () => dispatch({ type: "TOGGLE_RULERS" }),
				},
				{
					type: "item",
					label: state.snapToGrid ? "Disable Snap to Grid" : "Snap to Grid",
					action: () =>
						dispatch({
							type: "SET_VIEW_OPTS",
							patch: { snapToGrid: !state.snapToGrid },
						}),
				},
			],
		},
		{
			label: "Help",
			items: [
				{
					type: "item",
					label: "Keyboard Shortcuts...",
					action: () => setHelpOpen(true),
				},
			],
		},
	];

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			)
				return;

			const mod = e.ctrlKey || e.metaKey;
			if (mod && e.key.toLowerCase() === "n" && !e.shiftKey) {
				e.preventDefault();
				setNewOpen(true);
			}
			if (mod && e.key.toLowerCase() === "o") {
				e.preventDefault();
				openRef.current?.click();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const renderMenuItem = (item: MenuItem, index: number) => {
		if (item.type === "separator") {
			return <DropdownMenuSeparator key={`sep-${index}`} />;
		}
		return (
			<DropdownMenuItem
				key={item.label}
				disabled={item.disabled}
				onClick={item.action}
			>
				{item.label}
				{item.shortcut && (
					<DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
				)}
			</DropdownMenuItem>
		);
	};

	return (
		<>
			<header className="chrome-bar flex h-full w-full items-center gap-0 overflow-x-auto px-1">
				<span className="shrink-0 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text px-2 text-ui-sm font-bold tracking-tight text-transparent">
					PxEd
				</span>
				{menus.map((menu) => (
					<DropdownMenu key={menu.label}>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="interactive h-7 shrink-0 rounded px-2 text-ui-xs font-normal text-zinc-400 hover:text-zinc-100"
							>
								{menu.label}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="max-h-[min(70vh,28rem)] overflow-y-auto"
						>
							{menu.items.map(renderMenuItem)}
						</DropdownMenuContent>
					</DropdownMenu>
				))}
			</header>

			<input
				ref={openRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					const img = new Image();
					img.onload = () => {
						const w = img.width;
						const h = img.height;
						const layer = createLayer(w, h, "Background");
						layer.canvas.getContext("2d")!.drawImage(img, 0, 0);
						dispatch({
							type: "LOAD_PROJECT",
							state: {
								layers: [layer],
								canvasWidth: w,
								canvasHeight: h,
								activeLayerId: layer.id,
							},
						});
						void draftCache.clearDraftCache({ silent: true });
						toast.success("Image opened", file.name);
					};
					img.onerror = () => {
						toast.error("Could not open image", file.name);
					};
					img.src = URL.createObjectURL(file);
					e.target.value = "";
				}}
			/>

			<input
				ref={fileRef}
				type="file"
				accept=".json,application/json"
				className="hidden"
				onChange={async (e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					try {
						const text = await file.text();
						const data = parseProjectJson(text);
						const proj = restoreProject(data);
						dispatch({ type: "LOAD_PROJECT", state: proj });
						void draftCache.clearDraftCache({ silent: true });
						toast.success("Project opened", file.name);
					} catch {
						toast.error("Could not open project", file.name);
					}
					e.target.value = "";
				}}
			/>

			<Dialog open={newOpen} onOpenChange={setNewOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New Document</DialogTitle>
					</DialogHeader>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label>Width</Label>
							<Input
								type="number"
								value={newW}
								onChange={(e) => setNewW(+e.target.value)}
							/>
						</div>
						<div>
							<Label>Height</Label>
							<Input
								type="number"
								value={newH}
								onChange={(e) => setNewH(+e.target.value)}
							/>
						</div>
						<div className="col-span-2">
							<Label>Background</Label>
							<Input
								type="color"
								value={newBg}
								onChange={(e) => setNewBg(e.target.value)}
							/>
						</div>
					</div>
					<div className="mt-2 flex flex-wrap gap-2">
						{[
							[800, 600],
							[1920, 1080],
							[1080, 1080],
							[3840, 2160],
						].map(([w, h]) => (
							<Button
								key={w}
								variant="outline"
								size="sm"
								onClick={() => {
									setNewW(w);
									setNewH(h);
								}}
							>
								{w}×{h}
							</Button>
						))}
					</div>
					<Button
						className="mt-4"
						onClick={() => {
							dispatch({
								type: "NEW_DOCUMENT",
								width: newW,
								height: newH,
								bg: newBg,
							});
							void draftCache.clearDraftCache({ silent: true });
							setNewOpen(false);
							toast.success("New document created", `${newW}×${newH}`);
						}}
					>
						Create
					</Button>
				</DialogContent>
			</Dialog>

			<Dialog open={jpegOpen} onOpenChange={setJpegOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Export JPEG</DialogTitle>
					</DialogHeader>
					<Label>Quality: {jpegQ}%</Label>
					<Slider
						value={[jpegQ]}
						min={1}
						max={100}
						onValueChange={([v]) => setJpegQ(v!)}
					/>
					<Button
						onClick={() => {
							try {
								exportJpeg(
									state.layers,
									state.canvasWidth,
									state.canvasHeight,
									jpegQ,
								);
								toast.exportSaved("image.jpg");
								setJpegOpen(false);
							} catch {
								toast.error("JPEG export failed");
							}
						}}
					>
						Export
					</Button>
				</DialogContent>
			</Dialog>

			<Dialog open={canvasSizeOpen} onOpenChange={setCanvasSizeOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Canvas Size</DialogTitle>
					</DialogHeader>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label>Width</Label>
							<Input
								type="number"
								value={cw}
								onChange={(e) => setCw(+e.target.value)}
							/>
						</div>
						<div>
							<Label>Height</Label>
							<Input
								type="number"
								value={ch}
								onChange={(e) => setCh(+e.target.value)}
							/>
						</div>
					</div>
					<Button
						className="mt-4"
						onClick={() => {
							dispatch({ type: "SET_CANVAS_SIZE", width: cw, height: ch });
							setCanvasSizeOpen(false);
						}}
					>
						Apply
					</Button>
				</DialogContent>
			</Dialog>

			<Dialog open={!!filterOpen} onOpenChange={() => setFilterOpen(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{filterOpen === "blur"
								? "Gaussian Blur"
								: filterOpen === "noise"
									? "Add Noise"
									: "Pixelate"}
						</DialogTitle>
					</DialogHeader>
					<Slider
						value={[filterVal]}
						min={1}
						max={50}
						onValueChange={([v]) => setFilterVal(v!)}
					/>
					<Button
						onClick={() => {
							if (filterOpen === "blur")
								applyFilter(
									(ctx) => gaussianBlur(ctx, filterVal),
									"Gaussian Blur",
								);
							else if (filterOpen === "noise")
								applyFilter((ctx) => addNoise(ctx, filterVal), "Noise");
							else if (filterOpen === "pixelate")
								applyFilter((ctx) => pixelate(ctx, filterVal), "Pixelate");
						}}
					>
						Apply
					</Button>
				</DialogContent>
			</Dialog>

			<Dialog open={helpOpen} onOpenChange={setHelpOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Keyboard Shortcuts</DialogTitle>
					</DialogHeader>
					<ScrollArea className="max-h-[60vh] pr-3">
						<div className="space-y-4">
							{SHORTCUT_GROUPS.map((group) => (
								<div key={group.title}>
									<p className="mb-2 text-ui-xs font-semibold uppercase tracking-wide text-zinc-500">
										{group.title}
									</p>
									<ul className="space-y-1">
										{group.rows.map(([label, keys]) => (
											<li
												key={label}
												className="flex items-center justify-between gap-4 text-ui-sm text-zinc-300"
											>
												<span>{label}</span>
												<kbd className="shrink-0 rounded bg-zinc-700/80 px-1.5 py-0.5 font-mono text-ui-xs text-zinc-400">
													{keys}
												</kbd>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</>
	);
}
