import { describe, expect, it } from "vitest";
import { sampleColorAtDocPoint } from "@/lib/canvas/sampleColor";
import { createFilledLayer, createTestLayer } from "@tests/helpers";

describe("sampleColorAtDocPoint", () => {
	it("samples composited color from topmost visible layer", () => {
		const bottom = createFilledLayer(100, 100, "Bottom", "#ff0000");
		const top = createTestLayer(40, 40, "Top");
		top.x = 30;
		top.y = 30;
		const ctx = top.canvas.getContext("2d")!;
		ctx.fillStyle = "#0000ff";
		ctx.fillRect(0, 0, 40, 40);

		const hex = sampleColorAtDocPoint(
			[bottom, top],
			100,
			100,
			"#ffffff",
			50,
			50,
			1,
		);
		expect(hex).toBe("#0000ff");
	});

	it("samples document background outside layers", () => {
		const layer = createFilledLayer(20, 20, "Small", "#ff0000");
		layer.x = 10;
		layer.y = 10;

		const hex = sampleColorAtDocPoint(
			[layer],
			100,
			100,
			"#abcdef",
			2,
			2,
			1,
		);
		expect(hex).toBe("#abcdef");
	});
});
