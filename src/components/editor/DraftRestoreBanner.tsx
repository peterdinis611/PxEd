import { AnimatePresence, motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/context/EditorContext";

function formatDraftTime(ms: number): string {
	return new Date(ms).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function DraftRestoreBanner() {
	const { draftCache } = useEditor();
	const { pendingDraft, restoreDraft, discardDraft } = draftCache;

	return (
		<AnimatePresence>
			{pendingDraft && (
				<motion.div
					initial={{ opacity: 0, y: -12 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -12 }}
					transition={{ duration: 0.25 }}
					className="pointer-events-auto absolute left-1/2 top-3 z-30 w-[min(100%-1.5rem,28rem)] -translate-x-1/2"
					role="alert"
				>
					<div className="flex items-start gap-3 rounded-lg border border-accent bg-[var(--color-editor-panel)]/95 px-3 py-2.5 shadow-lg ring-accent-inset backdrop-blur-sm">
						<Clock
							className="text-accent mt-0.5 h-4 w-4 shrink-0"
							aria-hidden
						/>
						<div className="min-w-0 flex-1 text-left">
							<p className="text-ui-xs font-medium text-[var(--color-editor-text)]">
								Recover autosaved draft?
							</p>
							<p className="mt-0.5 font-data text-[10px] leading-snug text-[var(--color-editor-muted)]">
								Saved {formatDraftTime(pendingDraft.savedAt)} ·{" "}
								{pendingDraft.canvasWidth}×{pendingDraft.canvasHeight} ·{" "}
								{pendingDraft.layers.length} layer
								{pendingDraft.layers.length === 1 ? "" : "s"}
							</p>
						</div>
						<div className="flex shrink-0 items-center gap-1">
							<Button
								type="button"
								size="sm"
								className="h-7 px-2.5 text-ui-xs"
								onClick={() => void restoreDraft()}
							>
								Restore
							</Button>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								className="h-7 px-2 text-ui-xs text-zinc-400"
								onClick={() => void discardDraft()}
							>
								Discard
							</Button>
							<button
								type="button"
								className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
								aria-label="Dismiss"
								onClick={() => void discardDraft()}
							>
								<X className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
