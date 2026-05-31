import { createFilledLayer } from "@tests/helpers";
import { describe, expect, it } from "vitest";
import {
	bakeLayerRotation,
	normalizeAngle,
	rotateLayerBy,
} from "@/lib/canvas/transform";

describe("normalizeAngle", () => {
	it("wraps angles into 0–360", () => {
		expect(normalizeAngle(0)).toBe(0);
		expect(normalizeAngle(360)).toBe(0);
		expect(normalizeAngle(-90)).toBe(270);
		expect(normalizeAngle(450)).toBe(90);
	});
});

describe("rotateLayerBy", () => {
	it("adds rotation in degrees", () => {
		const layer = createFilledLayer();
		const next = rotateLayerBy(layer, 90);
		expect(next.rotation).toBe(90);
	});
});

describe("bakeLayerRotation", () => {
	it("returns the same layer when rotation is 0", () => {
		const layer = createFilledLayer();
		expect(bakeLayerRotation(layer)).toBe(layer);
	});

	it("bakes rotation into pixels and resets angle", () => {
		const layer = createFilledLayer(40, 40);
		const rotated = rotateLayerBy(layer, 90);
		const baked = bakeLayerRotation(rotated);
		expect(baked.rotation).toBe(0);
		expect(baked.canvas.width).toBeGreaterThan(0);
		expect(baked.canvas.height).toBeGreaterThan(0);
	});
});
