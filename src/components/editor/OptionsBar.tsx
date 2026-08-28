import { AnimatePresence, motion } from "framer-motion";
import { ColorPicker } from "@/components/editor/ColorPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useEditor } from "@/context/EditorContext";
import { snapCoord } from "@/lib/canvas/snap";
import { fadeSlideRight } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { BRUSH_PRESETS, type ToolName } from "@/types/editor";

function SliderControl({
	label,
	value,
	min,
	max,
	step = 1,
	onChange,
	className,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	onChange: (v: number) => void;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex min-w-[9.5rem] max-w-[11rem] items-center gap-1.5",
				className,
			)}
		>
			<span className="w-[3.25rem] shrink-0 text-ui-xs text-zinc-500">
				{label}
			</span>
			<Slider
				size="lg"
				value={[value]}
				min={min}
				max={max}
				step={step}
				className="min-w-[3.5rem] flex-1"
				onValueChange={([v]) => onChange(v!)}
			/>
			<input
				type="number"
				className="field-num"
				value={value}
				min={min}
				max={max}
				step={step}
				onChange={(e) => {
					const n = +e.target.value;
					if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
				}}
			/>
		</div>
	);
}

function ToggleBtn({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<Button
			variant={active ? "secondary" : "ghost"}
			size="sm"
			className="h-7 px-2.5 text-ui-xs font-medium"
			onClick={onClick}
		>
			{children}
		</Button>
	);
}

function OptionsStrip({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
			{children}
		</div>
	);
}

const TOOL_LABELS: Record<ToolName, string> = {
	move: "Move",
	hand: "Hand",
	"marquee-rect": "Rect Select",
	"marquee-ellipse": "Ellipse Select",
	lasso: "Lasso",
	"polygon-lasso": "Polygon Lasso",
	"magic-wand": "Magic Wand",
	crop: "Crop",
	brush: "Brush",
	pencil: "Pencil",
	eraser: "Eraser",
	"clone-stamp": "Clone Stamp",
	fill: "Paint Bucket",
	gradient: "Gradient",
	eyedropper: "Eyedropper",
	text: "Text",
	"shape-rect": "Rectangle",
	"shape-ellipse": "Ellipse",
	"shape-line": "Line",
	"shape-arrow": "Arrow",
	zoom: "Zoom",
};

export function OptionsBar() {
	const {
		state,
		dispatch,
		activeLayer,
		rotateActiveLayer,
		setActiveLayerRotation,
		commitHistory,
	} = useEditor();
	const { tool, brush, shape, zoom, marquee } = state;

	const setBrush = (patch: Partial<typeof brush>) =>
		dispatch({ type: "SET_BRUSH", brush: patch });
	const setShape = (patch: Partial<typeof shape>) =>
		dispatch({ type: "SET_SHAPE", shape: patch });
	const setMarquee = (patch: Partial<typeof marquee>) =>
		dispatch({ type: "SET_MARQUEE", marquee: patch });
	const setMisc = (
		patch: Partial<{
			eyedropperSample: number;
			gradientAngle: number;
			gradient: typeof state.gradient;
			fillOpacity: number;
			contiguousWand: boolean;
			textUnderline: boolean;
			textLineHeight: number;
		}>,
	) => dispatch({ type: "SET_MISC_TOOL", patch });

	const setColor = (which: "fg" | "bg", color: string) => {
		dispatch({
			type: "SET_COLORS",
			...(which === "fg" ? { fg: color } : { bg: color }),
		});
		dispatch({ type: "ADD_RECENT_COLOR", color });
	};

	return (
		<div className="chrome-bar w-full px-2 py-1">
			<div className="flex min-h-[1.75rem] items-center gap-2">
				<motion.span
					key={tool}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="w-14 shrink-0 text-ui-xs font-semibold text-zinc-300"
				>
					{TOOL_LABELS[tool]}
				</motion.span>

				<span className="chrome-vdivider" aria-hidden />

				<div className="flex shrink-0 items-center gap-1">
					<ColorPicker
						color={state.foregroundColor}
						onChange={(c) => setColor("fg", c)}
						recentColors={state.recentColors}
						label="Foreground (FG)"
					>
						<button
							type="button"
							className="flex h-7 items-center gap-1.5 rounded border border-zinc-600 bg-zinc-900/50 px-1.5 hover:border-zinc-500"
						>
							<span
								className="h-4 w-4 shrink-0 rounded-sm border border-zinc-600"
								style={{ backgroundColor: state.foregroundColor }}
							/>
							<span className="font-mono text-[10px] uppercase text-zinc-400">
								{state.foregroundColor}
							</span>
						</button>
					</ColorPicker>
					<ColorPicker
						color={state.backgroundColor}
						onChange={(c) => setColor("bg", c)}
						recentColors={state.recentColors}
						label="Background (BG)"
					>
						<button
							type="button"
							className="flex h-7 items-center gap-1.5 rounded border border-zinc-600 bg-zinc-900/50 px-1.5 hover:border-zinc-500"
						>
							<span
								className="h-4 w-4 shrink-0 rounded-sm border border-zinc-600"
								style={{ backgroundColor: state.backgroundColor }}
							/>
							<span className="font-mono text-[10px] uppercase text-zinc-400">
								{state.backgroundColor}
							</span>
						</button>
					</ColorPicker>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 shrink-0 text-zinc-500"
						title="Swap FG/BG (X)"
						onClick={() => dispatch({ type: "SWAP_COLORS" })}
					>
						⇄
					</Button>
				</div>

				<span className="chrome-vdivider" aria-hidden />

				<AnimatePresence mode="wait">
					<motion.div key={tool} className="min-w-0 flex-1" {...fadeSlideRight}>
						{(tool === "brush" || tool === "pencil") && (
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<div className="flex flex-wrap items-center gap-1">
									<span className="text-[10px] uppercase tracking-wide text-zinc-600">
										Presets
									</span>
									{BRUSH_PRESETS.map((preset) => (
										<button
											key={preset.id}
											type="button"
											className="h-6 rounded border border-zinc-700 bg-zinc-800/80 px-2 text-[10px] text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
											onClick={() => {
												setBrush(preset.brush);
												dispatch({ type: "PUSH_RECENT_BRUSH" });
											}}
										>
											{preset.name}
										</button>
									))}
									{state.recentBrushes.slice(0, 3).map((b, i) => (
										<button
											key={`recent-${i}-${b.size}-${b.hardness}`}
											type="button"
											title={`Size ${b.size} · Hard ${b.hardness}`}
											className="h-6 rounded border border-zinc-700/80 px-2 font-mono text-[10px] text-zinc-400 hover:text-zinc-200"
											onClick={() => setBrush(b)}
										>
											{b.size}px
										</button>
									))}
								</div>
								<details open className="group">
									<summary className="cursor-pointer select-none text-[10px] uppercase tracking-wide text-zinc-600 hover:text-zinc-400">
										Stroke
									</summary>
									<OptionsStrip>
										<SliderControl
											label="Size"
											value={brush.size}
											min={1}
											max={500}
											onChange={(size) => setBrush({ size })}
										/>
										<SliderControl
											label="Hardness"
											value={brush.hardness}
											min={0}
											max={100}
											onChange={(hardness) => setBrush({ hardness })}
										/>
										<SliderControl
											label="Opacity"
											value={brush.opacity}
											min={1}
											max={100}
											onChange={(opacity) => setBrush({ opacity })}
										/>
										<SliderControl
											label="Flow"
											value={brush.flow}
											min={1}
											max={100}
											onChange={(flow) => setBrush({ flow })}
										/>
									</OptionsStrip>
								</details>
								<details className="group">
									<summary className="cursor-pointer select-none text-[10px] uppercase tracking-wide text-zinc-600 hover:text-zinc-400">
										Advanced
									</summary>
									<OptionsStrip>
										<SliderControl
											label="Spacing"
											value={brush.spacing}
											min={1}
											max={100}
											onChange={(spacing) => setBrush({ spacing })}
										/>
										<SliderControl
											label="Smooth"
											value={brush.smoothing}
											min={0}
											max={100}
											onChange={(smoothing) => setBrush({ smoothing })}
										/>
										<Select
											value={brush.blendMode}
											onValueChange={(v) =>
												setBrush({ blendMode: v as typeof brush.blendMode })
											}
										>
											<SelectTrigger className="h-7 w-[7.5rem] text-ui-xs capitalize">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{[
													"source-over",
													"multiply",
													"screen",
													"overlay",
													"darken",
													"lighten",
												].map((m) => (
													<SelectItem
														key={m}
														value={m}
														className="text-ui-xs capitalize"
													>
														{m}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</OptionsStrip>
								</details>
							</div>
						)}

						{tool === "clone-stamp" && (
							<OptionsStrip>
								<span className="text-ui-xs text-zinc-500">
									{state.cloneSource
										? `Source ${Math.round(state.cloneSource.x)}, ${Math.round(state.cloneSource.y)}`
										: "Alt+click to set source"}
								</span>
								<SliderControl
									label="Size"
									value={brush.size}
									min={1}
									max={500}
									onChange={(size) => setBrush({ size })}
								/>
								<SliderControl
									label="Hardness"
									value={brush.hardness}
									min={0}
									max={100}
									onChange={(hardness) => setBrush({ hardness })}
								/>
								<SliderControl
									label="Opacity"
									value={brush.opacity}
									min={1}
									max={100}
									onChange={(opacity) => setBrush({ opacity })}
								/>
							</OptionsStrip>
						)}

						{tool === "eraser" && (
							<OptionsStrip>
								<SliderControl
									label="Size"
									value={brush.size}
									min={1}
									max={500}
									onChange={(size) => setBrush({ size })}
								/>
								<SliderControl
									label="Hardness"
									value={brush.hardness}
									min={0}
									max={100}
									onChange={(hardness) => setBrush({ hardness })}
								/>
								<SliderControl
									label="Opacity"
									value={brush.opacity}
									min={1}
									max={100}
									onChange={(opacity) => setBrush({ opacity })}
								/>
							</OptionsStrip>
						)}

						{tool === "move" && activeLayer && (
							<OptionsStrip>
								<label className="flex items-center gap-1 text-ui-xs text-zinc-500">
									X
									<Input
										type="number"
										className="h-7 w-14 px-1 text-center text-ui-xs tabular-nums"
										value={Math.round(activeLayer.x)}
										onChange={(e) =>
											dispatch({
												type: "UPDATE_LAYER",
												id: activeLayer.id,
												patch: {
													x: snapCoord(
														+e.target.value,
														state.gridSize,
														state.snapToGrid,
													),
												},
											})
										}
									/>
								</label>
								<label className="flex items-center gap-1 text-ui-xs text-zinc-500">
									Y
									<Input
										type="number"
										className="h-7 w-14 px-1 text-center text-ui-xs tabular-nums"
										value={Math.round(activeLayer.y)}
										onChange={(e) =>
											dispatch({
												type: "UPDATE_LAYER",
												id: activeLayer.id,
												patch: {
													y: snapCoord(
														+e.target.value,
														state.gridSize,
														state.snapToGrid,
													),
												},
											})
										}
									/>
								</label>
								<label className="flex items-center gap-1 text-ui-xs text-zinc-500">
									°
									<Input
										type="number"
										className="h-7 w-14 px-1 text-center text-ui-xs tabular-nums"
										value={Math.round(activeLayer.rotation ?? 0)}
										min={0}
										max={360}
										disabled={activeLayer.locked}
										onChange={(e) => setActiveLayerRotation(+e.target.value)}
										onBlur={() => commitHistory("Rotation")}
									/>
								</label>
								<ToggleBtn
									active={false}
									onClick={() => !activeLayer.locked && rotateActiveLayer(-90)}
								>
									−90°
								</ToggleBtn>
								<ToggleBtn
									active={false}
									onClick={() => !activeLayer.locked && rotateActiveLayer(90)}
								>
									+90°
								</ToggleBtn>
								<ToggleBtn
									active={state.snapToGrid}
									onClick={() =>
										dispatch({
											type: "SET_VIEW_OPTS",
											patch: { snapToGrid: !state.snapToGrid },
										})
									}
								>
									Snap
								</ToggleBtn>
							</OptionsStrip>
						)}

						{(tool === "marquee-rect" || tool === "marquee-ellipse") && (
							<OptionsStrip>
								<SliderControl
									label="Feather"
									value={marquee.feather}
									min={0}
									max={100}
									onChange={(feather) => setMarquee({ feather })}
								/>
								<ToggleBtn
									active={marquee.antiAlias}
									onClick={() => setMarquee({ antiAlias: !marquee.antiAlias })}
								>
									Anti-alias
								</ToggleBtn>
								<ToggleBtn
									active={marquee.fixedRatio}
									onClick={() =>
										setMarquee({ fixedRatio: !marquee.fixedRatio })
									}
								>
									Ratio
								</ToggleBtn>
								{marquee.fixedRatio && (
									<>
										<Input
											type="number"
											className="h-7 w-12 px-1 text-ui-xs tabular-nums"
											value={marquee.ratioW}
											min={1}
											onChange={(e) => setMarquee({ ratioW: +e.target.value })}
										/>
										<span className="text-ui-xs text-zinc-600">:</span>
										<Input
											type="number"
											className="h-7 w-12 px-1 text-ui-xs tabular-nums"
											value={marquee.ratioH}
											min={1}
											onChange={(e) => setMarquee({ ratioH: +e.target.value })}
										/>
									</>
								)}
							</OptionsStrip>
						)}

						{tool === "lasso" && (
							<span className="text-ui-xs text-zinc-500">
								Drag to draw selection
							</span>
						)}

						{tool === "polygon-lasso" && (
							<span className="text-ui-xs text-zinc-500">
								Click to add points · click start to close · Esc to cancel
							</span>
						)}

						{tool === "hand" && (
							<span className="text-ui-xs text-zinc-500">
								Drag to pan · Space also pans
							</span>
						)}

						{tool === "magic-wand" && (
							<OptionsStrip>
								<SliderControl
									label="Tolerance"
									value={state.magicWandTolerance}
									min={0}
									max={255}
									onChange={(v) =>
										dispatch({ type: "SET_TOLERANCE", magic: v })
									}
								/>
								<ToggleBtn
									active={state.contiguousWand}
									onClick={() =>
										setMisc({ contiguousWand: !state.contiguousWand })
									}
								>
									Contiguous
								</ToggleBtn>
							</OptionsStrip>
						)}

						{tool === "crop" && (
							<OptionsStrip>
								<ToggleBtn
									active={marquee.fixedRatio}
									onClick={() =>
										setMarquee({ fixedRatio: !marquee.fixedRatio })
									}
								>
									Lock aspect
								</ToggleBtn>
								{marquee.fixedRatio && (
									<>
										<Input
											type="number"
											className="h-7 w-12 px-1 text-ui-xs"
											value={marquee.ratioW}
											onChange={(e) => setMarquee({ ratioW: +e.target.value })}
										/>
										<span className="text-ui-xs text-zinc-600">:</span>
										<Input
											type="number"
											className="h-7 w-12 px-1 text-ui-xs"
											value={marquee.ratioH}
											onChange={(e) => setMarquee({ ratioH: +e.target.value })}
										/>
									</>
								)}
							</OptionsStrip>
						)}

						{tool === "fill" && (
							<OptionsStrip>
								<SliderControl
									label="Tolerance"
									value={state.fillTolerance}
									min={0}
									max={255}
									onChange={(v) => dispatch({ type: "SET_TOLERANCE", fill: v })}
								/>
								<SliderControl
									label="Opacity"
									value={state.fillOpacity}
									min={1}
									max={100}
									onChange={(fillOpacity) => setMisc({ fillOpacity })}
								/>
								<ToggleBtn
									active={state.contiguousWand}
									onClick={() =>
										setMisc({ contiguousWand: !state.contiguousWand })
									}
								>
									Contiguous
								</ToggleBtn>
							</OptionsStrip>
						)}

						{tool === "gradient" && (
							<OptionsStrip>
								<ToggleBtn
									active={state.gradient.type === "linear"}
									onClick={() =>
										setMisc({
											gradient: { ...state.gradient, type: "linear" },
										})
									}
								>
									Linear
								</ToggleBtn>
								<ToggleBtn
									active={state.gradient.type === "radial"}
									onClick={() =>
										setMisc({
											gradient: { ...state.gradient, type: "radial" },
										})
									}
								>
									Radial
								</ToggleBtn>
								{state.gradient.stops.map((stop, i) => (
									<div key={i} className="flex items-center gap-1">
										<input
											type="color"
											className="h-6 w-7 cursor-pointer rounded border border-zinc-700 bg-transparent"
											value={stop.color}
											onChange={(e) => {
												const stops = state.gradient.stops.map((s, j) =>
													j === i ? { ...s, color: e.target.value } : s,
												);
												setMisc({ gradient: { ...state.gradient, stops } });
											}}
										/>
										<input
											type="number"
											className="field-num w-10"
											min={0}
											max={100}
											value={Math.round(stop.offset * 100)}
											onChange={(e) => {
												const offset = Math.min(
													1,
													Math.max(0, +e.target.value / 100),
												);
												const stops = state.gradient.stops.map((s, j) =>
													j === i ? { ...s, offset } : s,
												);
												setMisc({ gradient: { ...state.gradient, stops } });
											}}
										/>
										{state.gradient.stops.length > 2 && (
											<button
												type="button"
												className="text-ui-xs text-zinc-500 hover:text-red-400"
												onClick={() => {
													const stops = state.gradient.stops.filter(
														(_, j) => j !== i,
													);
													setMisc({
														gradient: { ...state.gradient, stops },
													});
												}}
											>
												×
											</button>
										)}
									</div>
								))}
								{state.gradient.stops.length < 6 && (
									<Button
										size="sm"
										variant="ghost"
										className="h-7 px-2 text-ui-xs"
										onClick={() => {
											const mid = {
												offset: 0.5,
												color: state.foregroundColor,
											};
											const stops = [...state.gradient.stops, mid].sort(
												(a, b) => a.offset - b.offset,
											);
											setMisc({ gradient: { ...state.gradient, stops } });
										}}
									>
										+ Stop
									</Button>
								)}
								<span className="text-ui-xs text-zinc-500">Drag on canvas</span>
							</OptionsStrip>
						)}

						{tool === "eyedropper" && (
							<OptionsStrip>
								<span className="text-ui-xs text-zinc-500">
									Click · Alt = BG
								</span>
								<span className="text-ui-xs text-zinc-500">Sample</span>
								{[1, 3, 5].map((n) => (
									<ToggleBtn
										key={n}
										active={state.eyedropperSample === n}
										onClick={() => setMisc({ eyedropperSample: n })}
									>
										{n}×{n}
									</ToggleBtn>
								))}
							</OptionsStrip>
						)}

						{tool === "text" && (
							<OptionsStrip>
								<Input
									className="h-7 w-32 text-ui-xs"
									value={state.textFont}
									onChange={(e) =>
										dispatch({
											type: "SET_TEXT_OPTS",
											patch: { textFont: e.target.value },
										})
									}
								/>
								<SliderControl
									label="Size"
									value={state.textSize}
									min={8}
									max={300}
									onChange={(textSize) =>
										dispatch({ type: "SET_TEXT_OPTS", patch: { textSize } })
									}
								/>
								<SliderControl
									label="Leading"
									value={state.textLineHeight}
									min={80}
									max={200}
									onChange={(textLineHeight) => setMisc({ textLineHeight })}
								/>
								<ToggleBtn
									active={state.textBold}
									onClick={() =>
										dispatch({
											type: "SET_TEXT_OPTS",
											patch: { textBold: !state.textBold },
										})
									}
								>
									B
								</ToggleBtn>
								<ToggleBtn
									active={state.textItalic}
									onClick={() =>
										dispatch({
											type: "SET_TEXT_OPTS",
											patch: { textItalic: !state.textItalic },
										})
									}
								>
									I
								</ToggleBtn>
								<ToggleBtn
									active={state.textUnderline}
									onClick={() =>
										setMisc({ textUnderline: !state.textUnderline })
									}
								>
									U
								</ToggleBtn>
								<Select
									value={state.textAlign}
									onValueChange={(v) =>
										dispatch({
											type: "SET_TEXT_OPTS",
											patch: { textAlign: v as CanvasTextAlign },
										})
									}
								>
									<SelectTrigger className="h-7 w-20 text-ui-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="left">Left</SelectItem>
										<SelectItem value="center">Center</SelectItem>
										<SelectItem value="right">Right</SelectItem>
									</SelectContent>
								</Select>
							</OptionsStrip>
						)}

						{(tool === "shape-rect" ||
							tool === "shape-ellipse" ||
							tool === "shape-line" ||
							tool === "shape-arrow") && (
							<OptionsStrip>
								<input
									type="color"
									value={shape.fillColor}
									onChange={(e) => setShape({ fillColor: e.target.value })}
									className="h-7 w-7 cursor-pointer rounded border border-zinc-600 bg-transparent"
									title="Fill"
								/>
								<input
									type="color"
									value={shape.strokeColor}
									onChange={(e) => setShape({ strokeColor: e.target.value })}
									className="h-7 w-7 cursor-pointer rounded border border-zinc-600 bg-transparent"
									title="Stroke"
								/>
								<SliderControl
									label="Stroke"
									value={shape.strokeWidth}
									min={0}
									max={50}
									onChange={(strokeWidth) => setShape({ strokeWidth })}
								/>
								{tool === "shape-rect" && (
									<SliderControl
										label="Radius"
										value={shape.cornerRadius}
										min={0}
										max={100}
										onChange={(cornerRadius) => setShape({ cornerRadius })}
									/>
								)}
								<ToggleBtn
									active={shape.filled}
									onClick={() => setShape({ filled: !shape.filled })}
								>
									Fill
								</ToggleBtn>
								<Select
									value={shape.lineCap}
									onValueChange={(v) =>
										setShape({ lineCap: v as CanvasLineCap })
									}
								>
									<SelectTrigger className="h-7 w-20 text-ui-xs">
										<SelectValue placeholder="Cap" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="butt">Butt</SelectItem>
										<SelectItem value="round">Round</SelectItem>
										<SelectItem value="square">Square</SelectItem>
									</SelectContent>
								</Select>
							</OptionsStrip>
						)}

						{tool === "zoom" && (
							<OptionsStrip>
								<span className="text-ui-xs font-medium tabular-nums text-zinc-300">
									{Math.round(zoom)}%
								</span>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-ui-xs"
									onClick={() => dispatch({ type: "REQUEST_FIT_TO_SCREEN" })}
								>
									Fit
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-ui-xs"
									onClick={() => dispatch({ type: "SET_ZOOM", zoom: 100 })}
								>
									100%
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-ui-xs"
									onClick={() =>
										dispatch({
											type: "SET_ZOOM",
											zoom: Math.min(800, zoom + 25),
										})
									}
								>
									+
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-ui-xs"
									onClick={() =>
										dispatch({ type: "SET_ZOOM", zoom: Math.max(5, zoom - 25) })
									}
								>
									−
								</Button>
							</OptionsStrip>
						)}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}
