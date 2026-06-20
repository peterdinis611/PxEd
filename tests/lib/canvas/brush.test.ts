import { describe, expect, it } from "vitest";
import { brushOptionsFromState } from "@/lib/canvas/brush";
import { DEFAULT_BRUSH } from "@/types/editor";

describe("brush stroke", () => {
	it("configures pencil mode with full hardness", () => {
		const opts = brushOptionsFromState(DEFAULT_BRUSH, "#ff0000", "pencil");
		expect(opts.pencil).toBe(true);
		expect(opts.hardness).toBe(100);
		expect(opts.spacing).toBe(100);
	});
});
