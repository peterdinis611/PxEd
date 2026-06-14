import { describe, expect, it } from "vitest";
import {
	clampDocumentSize,
	DOC_LIMITS,
	fitWithinDocumentLimits,
	getHistoryLimit,
	shouldSkipAutosave,
} from "@/lib/canvas/documentLimits";

describe("documentLimits", () => {
	it("clamps oversized edges", () => {
		const r = clampDocumentSize(12000, 8000);
		expect(r.width).toBeLessThanOrEqual(DOC_LIMITS.MAX_EDGE_PX);
		expect(r.height).toBeLessThanOrEqual(DOC_LIMITS.MAX_EDGE_PX);
		expect(r.clamped).toBe(true);
	});

	it("fits huge images within megapixel cap", () => {
		const r = fitWithinDocumentLimits(10000, 10000);
		expect(r.width * r.height).toBeLessThanOrEqual(
			DOC_LIMITS.MAX_MEGAPIXELS * 1_000_000 + 1,
		);
		expect(r.scaled).toBe(true);
	});

	it("reduces undo depth for large documents", () => {
		expect(getHistoryLimit(6000, 4000, 1)).toBe(2);
		expect(getHistoryLimit(800, 600, 2)).toBe(DOC_LIMITS.MAX_HISTORY_STEPS);
	});

	it("skips autosave when layer payload is too large", () => {
		expect(shouldSkipAutosave(5000, 5000, 5)).toBe(true);
		expect(shouldSkipAutosave(1000, 1000, 2)).toBe(false);
	});
});
