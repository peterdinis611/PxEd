import { generateId } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
	id: string;
	title: string;
	description?: string;
	variant: ToastVariant;
	duration: number;
}

const DEFAULT_DURATION_MS = 3500;
const DRAFT_SAVED_DURATION_MS = 2200;
const MAX_VISIBLE = 5;

let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

function notify() {
	for (const listener of listeners) listener();
}

function clearDismissTimer(id: string) {
	const t = dismissTimers.get(id);
	if (t) {
		clearTimeout(t);
		dismissTimers.delete(id);
	}
}

function scheduleDismiss(id: string, duration: number) {
	clearDismissTimer(id);
	dismissTimers.set(
		id,
		setTimeout(() => {
			dismiss(id);
		}, duration),
	);
}

function pushToast(
	item: Omit<ToastItem, "id"> & { id?: string },
	duration = DEFAULT_DURATION_MS,
): string {
	const id = item.id ?? generateId();
	const next: ToastItem = {
		id,
		title: item.title,
		description: item.description,
		variant: item.variant,
		duration,
	};

	const idx = toasts.findIndex((t) => t.id === id);
	if (idx >= 0) {
		toasts = [...toasts.slice(0, idx), next, ...toasts.slice(idx + 1)];
	} else {
		toasts = [...toasts, next].slice(-MAX_VISIBLE);
	}

	notify();
	scheduleDismiss(id, duration);
	return id;
}

export function dismiss(id: string) {
	clearDismissTimer(id);
	if (!toasts.some((t) => t.id === id)) return;
	toasts = toasts.filter((t) => t.id !== id);
	notify();
}

export function getToasts(): readonly ToastItem[] {
	return toasts;
}

export function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export const toast = {
	success(title: string, description?: string) {
		return pushToast({ title, description, variant: "success" });
	},
	error(title: string, description?: string) {
		return pushToast({ title, description, variant: "error", duration: 4500 });
	},
	info(title: string, description?: string) {
		return pushToast({ title, description, variant: "info" });
	},
	exportSaved(filename: string) {
		return pushToast({
			title: "Export complete",
			description: filename,
			variant: "success",
		});
	},
	draftSaved() {
		return pushToast(
			{
				id: "draft-autosave",
				title: "Draft saved",
				description: "Autosaved locally",
				variant: "success",
			},
			DRAFT_SAVED_DURATION_MS,
		);
	},
	draftSaving() {
		return pushToast(
			{
				id: "draft-autosave",
				title: "Saving draft…",
				variant: "info",
			},
			60_000,
		);
	},
};
