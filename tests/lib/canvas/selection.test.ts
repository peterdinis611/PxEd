import { describe, expect, it } from "vitest";
import {
	normalizeRect,
	pointInSelection,
	selectionBounds,
} from "@/lib/canvas/selection";

describe("normalizeRect", () => {
	it("normalizes inverted drag coordinates", () => {
		expect(normalizeRect(10, 20, 30, 5)).toEqual({
			x: 10,
			y: 5,
			width: 20,
			height: 15,
		});
	});
});

describe("selectionBounds", () => {
	it("returns rect dimensions for rect selections", () => {
		expect(
			selectionBounds({ type: "rect", x: 1, y: 2, width: 10, height: 20 }),
		).toEqual({ x: 1, y: 2, width: 10, height: 20 });
	});

	it("computes bounds for lasso points", () => {
		expect(
			selectionBounds({
				type: "lasso",
				points: [
					{ x: 0, y: 0 },
					{ x: 50, y: 10 },
					{ x: 20, y: 40 },
				],
			}),
		).toEqual({ x: 0, y: 0, width: 50, height: 40 });
	});

	it("returns null for empty lasso", () => {
		expect(selectionBounds({ type: "lasso", points: [] })).toBeNull();
	});
});

describe("pointInSelection", () => {
	it("detects points inside a rect", () => {
		const sel = { type: "rect" as const, x: 10, y: 10, width: 20, height: 20 };
		expect(pointInSelection(15, 15, sel)).toBe(true);
		expect(pointInSelection(5, 15, sel)).toBe(false);
	});

	it("detects points inside an ellipse", () => {
		const sel = {
			type: "ellipse" as const,
			x: 0,
			y: 0,
			width: 100,
			height: 100,
		};
		expect(pointInSelection(50, 50, sel)).toBe(true);
		expect(pointInSelection(0, 0, sel)).toBe(false);
	});
});
