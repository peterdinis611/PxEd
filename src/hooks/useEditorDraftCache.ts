import { useCallback, useEffect, useRef, useState } from "react";
import {
	buildEditorDraft,
	type DraftSourceState,
} from "@/lib/cache/buildDraft";
import {
	clearEditorDraft,
	draftHasMeaningfulContent,
	type EditorDraftCache,
	isDraftStorageAvailable,
	layersFromDraft,
	loadEditorDraft,
	saveEditorDraft,
} from "@/lib/cache/draftStorage";
import type { Layer } from "@/types/editor";

const AUTOSAVE_MS = 2000;

export type DraftCacheStatus =
	| "idle"
	| "saving"
	| "saved"
	| "unavailable"
	| "error";

export function useEditorDraftCache(
	state: DraftSourceState,
	onRestore: (draft: EditorDraftCache, layers: Layer[]) => void,
) {
	const [status, setStatus] = useState<DraftCacheStatus>(
		isDraftStorageAvailable() ? "idle" : "unavailable",
	);
	const [pendingDraft, setPendingDraft] = useState<EditorDraftCache | null>(
		null,
	);
	const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastFingerprint = useRef<string | null>(null);
	const hydrated = useRef(false);
	const skipNextSave = useRef(false);

	const fingerprint = `${state.renderTick ?? 0}:${state.layers.length}:${state.canvasWidth}x${state.canvasHeight}:${state.activeLayerId}`;

	useEffect(() => {
		if (!isDraftStorageAvailable()) {
			setStatus("unavailable");
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const draft = await loadEditorDraft();
				if (cancelled || !draft || !draftHasMeaningfulContent(draft)) return;
				setPendingDraft(draft);
			} catch {
				if (!cancelled) setStatus("error");
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!isDraftStorageAvailable() || !hydrated.current) return;
		if (skipNextSave.current) {
			skipNextSave.current = false;
			return;
		}
		if (fingerprint === lastFingerprint.current) return;

		if (saveTimer.current) clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => {
			void (async () => {
				try {
					setStatus("saving");
					const draft = buildEditorDraft(state);
					if (!draftHasMeaningfulContent(draft)) {
						await clearEditorDraft();
						lastFingerprint.current = fingerprint;
						setStatus("idle");
						setLastSavedAt(null);
						return;
					}
					await saveEditorDraft(draft);
					lastFingerprint.current = fingerprint;
					setLastSavedAt(draft.savedAt);
					setStatus("saved");
				} catch {
					setStatus("error");
				}
			})();
		}, AUTOSAVE_MS);

		return () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
		};
	}, [state, fingerprint]);

	useEffect(() => {
		hydrated.current = true;
	}, []);

	const restoreDraft = useCallback(async () => {
		const draft = pendingDraft;
		if (!draft) return;
		try {
			const layers = await layersFromDraft(draft);
			skipNextSave.current = true;
			onRestore(draft, layers);
			setPendingDraft(null);
			lastFingerprint.current = `${layers.length}:${draft.canvasWidth}x${draft.canvasHeight}:${draft.activeLayerId}`;
		} catch {
			setStatus("error");
		}
	}, [pendingDraft, onRestore]);

	const discardDraft = useCallback(async () => {
		skipNextSave.current = true;
		setPendingDraft(null);
		try {
			await clearEditorDraft();
			setLastSavedAt(null);
			setStatus("idle");
		} catch {
			setStatus("error");
		}
	}, []);

	const clearDraftCache = useCallback(async () => {
		skipNextSave.current = true;
		setPendingDraft(null);
		try {
			await clearEditorDraft();
			setLastSavedAt(null);
			setStatus("idle");
			lastFingerprint.current = fingerprint;
		} catch {
			setStatus("error");
		}
	}, [fingerprint]);

	return {
		status,
		lastSavedAt,
		pendingDraft,
		restoreDraft,
		discardDraft,
		clearDraftCache,
		storageAvailable: isDraftStorageAvailable(),
	};
}
