import { RotateCcw, RotateCw } from "lucide-react";
import { ImageMetadataPanel } from "@/components/editor/ImageMetadataPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useEditor } from "@/context/EditorContext";
import { isDocumentBackdropLayer } from "@/lib/canvas/layerBounds";
import { snapCoord } from "@/lib/canvas/snap";
import type { BlendMode } from "@/types/editor";

const BLEND_MODES: BlendMode[] = [
	"normal",
	"multiply",
	"screen",
	"overlay",
	"darken",
	"lighten",
	"color-dodge",
	"color-burn",
	"hard-light",
	"soft-light",
	"difference",
	"exclusion",
];

export function LayerProperties() {
	const {
		state,
		dispatch,
		commitHistory,
		rotateActiveLayer,
		setActiveLayerRotation,
		bakeActiveLayerRotation,
	} = useEditor();
	const active = state.layers.find((l) => l.id === state.activeLayerId);

	const snap = (n: number) => snapCoord(n, state.gridSize, state.snapToGrid);
	if (!active) return null;

	const rotation = active.rotation ?? 0;
	const isBackdrop = isDocumentBackdropLayer(
		active,
		state.canvasWidth,
		state.canvasHeight,
	);
	const canRotate = !active.locked && !isBackdrop;

	return (
		<>
		<section className="sidebar-section shrink-0 px-2 py-1.5">
			<div className="grid grid-cols-[1fr_1fr_auto] items-end gap-x-2 gap-y-1">
				<div>
					<Label className="text-ui-xs text-zinc-600">X</Label>
					<Input
						type="number"
						className="mt-0.5 h-7 px-1.5 text-ui-xs tabular-nums"
						value={Math.round(active.x)}
						onChange={(e) =>
							dispatch({
								type: "UPDATE_LAYER",
								id: active.id,
								patch: { x: snap(+e.target.value) },
							})
						}
					/>
				</div>
				<div>
					<Label className="text-ui-xs text-zinc-600">Y</Label>
					<Input
						type="number"
						className="mt-0.5 h-7 px-1.5 text-ui-xs tabular-nums"
						value={Math.round(active.y)}
						onChange={(e) =>
							dispatch({
								type: "UPDATE_LAYER",
								id: active.id,
								patch: { y: snap(+e.target.value) },
							})
						}
					/>
				</div>
				<p className="pb-1 text-right text-ui-xs tabular-nums text-zinc-500">
					{active.canvas.width}×{active.canvas.height}
				</p>
			</div>

			<div className="mt-1.5 flex items-center gap-2">
				<Label className="w-12 shrink-0 text-ui-xs text-zinc-600">
					Opacity
				</Label>
				<Slider
					size="lg"
					value={[active.opacity]}
					min={0}
					max={100}
					step={1}
					className="flex-1"
					onValueChange={([v]) =>
						dispatch({
							type: "UPDATE_LAYER",
							id: active.id,
							patch: { opacity: v! },
						})
					}
				/>
				<span className="w-8 text-right text-ui-xs tabular-nums text-zinc-400">
					{active.opacity}
				</span>
			</div>

			<div className="mt-1.5 space-y-1">
				<div className="flex items-center justify-between gap-2">
					<Label className="text-ui-xs text-zinc-600">Angle</Label>
					<span className="text-ui-xs tabular-nums text-zinc-400">
						{Math.round(rotation)}°
					</span>
				</div>
				<Slider
					size="lg"
					value={[rotation]}
					min={0}
					max={360}
					step={1}
					disabled={!canRotate}
					onValueChange={([v]) => setActiveLayerRotation(v!)}
					onValueCommit={() => commitHistory("Rotation")}
				/>
				<div className="flex gap-1">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 flex-1 px-0 text-ui-xs"
						disabled={!canRotate}
						onClick={() => rotateActiveLayer(-90)}
						title="Rotate 90° counter-clockwise"
					>
						<RotateCcw className="mr-1 h-3 w-3" />
						−90°
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 flex-1 px-0 text-ui-xs"
						disabled={!canRotate}
						onClick={() => rotateActiveLayer(90)}
						title="Rotate 90° clockwise"
					>
						<RotateCw className="mr-1 h-3 w-3" />
						+90°
					</Button>
				</div>
				{rotation !== 0 && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-6 w-full text-[10px] text-zinc-500"
						disabled={!canRotate}
						onClick={bakeActiveLayerRotation}
					>
						Bake rotation
					</Button>
				)}
				{isBackdrop && (
					<p className="text-[10px] leading-snug text-amber-400/80">
						Background cannot rotate
					</p>
				)}
			</div>

			<div className="mt-1.5 flex items-center gap-2">
				<Label className="w-12 shrink-0 text-ui-xs text-zinc-600">Blend</Label>
				<Select
					value={active.blendMode}
					onValueChange={(v) =>
						dispatch({
							type: "UPDATE_LAYER",
							id: active.id,
							patch: { blendMode: v as BlendMode },
						})
					}
				>
					<SelectTrigger className="h-7 flex-1 text-ui-xs capitalize">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{BLEND_MODES.map((m) => (
							<SelectItem key={m} value={m} className="text-ui-xs capitalize">
								{m.replace("-", " ")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</section>
		{active.sourceMetadata ? (
			<ImageMetadataPanel metadata={active.sourceMetadata} />
		) : null}
		</>
	);
}
