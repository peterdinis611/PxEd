import { AnimatePresence, motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
	formatMegapixels,
	getDocumentProfile,
} from "@/lib/canvas/documentLimits";
import { useEditor } from "@/context/EditorContext";

function StatusItem({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-baseline gap-2">
			<span className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
				{label}
			</span>
			<span className="tabular-nums text-zinc-400">{children}</span>
		</div>
	);
}

export function StatusBar({
	cursor,
	spacePan,
}: {
	cursor: { x: number; y: number; rgba: string };
	spacePan?: boolean;
}) {
	const { state, activeLayer, draftCache } = useEditor();
	const profile = getDocumentProfile(
		state.canvasWidth,
		state.canvasHeight,
		state.layers.length,
	);

	const draftLabel =
		!profile.autosaveEnabled
			? "Autosave off (large doc)"
			: draftCache.status === "saving"
			? "Saving draft…"
			: draftCache.status === "saved" && draftCache.lastSavedAt
				? `Draft saved ${new Date(draftCache.lastSavedAt).toLocaleTimeString(
						undefined,
						{
							hour: "2-digit",
							minute: "2-digit",
						},
					)}`
				: draftCache.status === "error"
					? "Draft save failed"
					: null;

	return (
		<footer className="chrome-bar flex h-full w-full items-center gap-3 px-3 text-ui-xs">
			<StatusItem label="Zoom">
				<AnimatedNumber
					value={state.zoom}
					format={(n) => `${Math.round(n)}%`}
				/>
			</StatusItem>
			<span className="h-3 w-px bg-zinc-700" />
			<StatusItem label="Canvas">
				{state.canvasWidth} × {state.canvasHeight}
				{profile.isLarge ? (
					<span className="ml-1 text-amber-500/90">
						· {formatMegapixels(profile.megapixels)} · undo×
						{profile.historyLimit}
					</span>
				) : null}
			</StatusItem>
			<span className="h-3 w-px bg-zinc-700" />
			<StatusItem label="XY">
				<AnimatedNumber
					value={cursor.x}
					format={(n) => String(Math.round(n))}
				/>
				,{" "}
				<AnimatedNumber
					value={cursor.y}
					format={(n) => String(Math.round(n))}
				/>
			</StatusItem>
			<span className="hidden h-3 w-px bg-zinc-700 sm:block" />
			<span className="hidden h-3 w-px bg-zinc-700 sm:block" />
			<StatusItem label="Color">
				<span className="max-w-[180px] truncate">{cursor.rgba}</span>
			</StatusItem>

			<AnimatePresence>
				{draftLabel && draftCache.storageAvailable && (
					<motion.span
						key={draftLabel}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						className={
							draftCache.status === "error"
								? "rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-400"
								: "rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500"
						}
					>
						{draftLabel}
					</motion.span>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{spacePan && (
					<motion.span
						initial={{ opacity: 0, scale: 0.9, x: 8 }}
						animate={{ opacity: 1, scale: 1, x: 0 }}
						exit={{ opacity: 0, scale: 0.9 }}
						className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-ui-sm font-medium text-blue-400"
					>
						Pan mode
					</motion.span>
				)}
			</AnimatePresence>

			<motion.span
				key={activeLayer?.id}
				initial={{ opacity: 0, y: 4 }}
				animate={{ opacity: 1, y: 0 }}
				className="ml-auto truncate text-zinc-500"
			>
				{activeLayer?.name ?? "—"}
			</motion.span>
		</footer>
	);
}
