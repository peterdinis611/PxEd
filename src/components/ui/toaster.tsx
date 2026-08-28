import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { dismiss, getToasts, subscribe, type ToastVariant } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ICONS: Record<
	ToastVariant,
	typeof CheckCircle2
> = {
	success: CheckCircle2,
	error: AlertCircle,
	info: Info,
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
	success: "border-emerald-500/30 bg-zinc-900/95 text-emerald-50",
	error: "border-red-500/35 bg-zinc-900/95 text-red-50",
	info: "border-accent bg-[var(--color-editor-panel)]/95 text-[var(--color-editor-text)]",
};

const ICON_STYLES: Record<ToastVariant, string> = {
	success: "text-emerald-400",
	error: "text-red-400",
	info: "text-accent",
};

export function Toaster() {
	const items = useSyncExternalStore(subscribe, getToasts, getToasts);

	return (
		<div
			className="pointer-events-none fixed bottom-10 right-4 z-[100] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
			aria-live="polite"
			aria-label="Notifications"
		>
			<AnimatePresence initial={false}>
				{items.map((item) => {
					const Icon = ICONS[item.variant];
					return (
						<motion.div
							key={item.id}
							layout
							initial={{ opacity: 0, y: 12, scale: 0.96 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 8, scale: 0.96 }}
							transition={{ type: "spring", stiffness: 420, damping: 32 }}
							className={cn(
								"pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3 py-2.5 shadow-lg backdrop-blur-sm",
								VARIANT_STYLES[item.variant],
							)}
						>
							<Icon
								className={cn("mt-0.5 size-4 shrink-0", ICON_STYLES[item.variant])}
								aria-hidden
							/>
							<div className="min-w-0 flex-1">
								<p className="text-ui-sm font-medium leading-snug">{item.title}</p>
								{item.description ? (
									<p className="mt-0.5 truncate text-ui-xs text-zinc-400">
										{item.description}
									</p>
								) : null}
							</div>
							<button
								type="button"
								className="interactive -mr-1 shrink-0 rounded p-1 text-zinc-500 hover:text-zinc-200"
								aria-label="Dismiss"
								onClick={() => dismiss(item.id)}
							>
								<X className="size-3.5" />
							</button>
						</motion.div>
					);
				})}
			</AnimatePresence>
		</div>
	);
}
