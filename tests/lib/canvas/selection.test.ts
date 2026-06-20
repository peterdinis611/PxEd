import { describe, expect, it } from "vitest";
import {
	canInvertSelection,
	constrainRectToRatio,
	normalizeRect,
} from "@/lib/canvas/selection";

describe("selection helpers", () => {
	it("constrains drag rect to fixed ratio", () => {
		const r = constrainRectToRatio(0, 0, 200, 50, 1, 1);
		expect(r.width).toBe(200);
		expect(r.height).toBe(200);
	});

	it("normalizes negative drag directions", () => {
		const r = normalizeRect(100, 100, 0, 0);
		expect(r).toEqual({ x: 0, y: 0, width: 100, height: 100 });
	});

	it("detects invertible selections", () => {
		expect(canInvertSelection(null)).toBe(false);
		expect(canInvertSelection({ type: "rect", x: 0, y: 0, width: 10, height: 10 })).toBe(
			true,
		);
	});
});
