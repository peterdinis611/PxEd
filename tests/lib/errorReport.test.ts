import { describe, expect, it } from "vitest";
import { buildErrorContext, formatErrorReport } from "@/lib/errorReport";

describe("buildErrorContext", () => {
	it("uses the provided route and includes a timestamp", () => {
		const ctx = buildErrorContext("/editor");
		expect(ctx.route).toBe("/editor");
		expect(ctx.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});
});

describe("formatErrorReport", () => {
	it("formats error name, message, stack, and context", () => {
		const err = new Error("Canvas failed");
		err.stack = "Error: Canvas failed\n    at test.ts:1:1";
		const text = formatErrorReport({
			error: err,
			componentStack: "  at EditorApp",
			context: {
				route: "/",
				timestamp: "2026-05-30T12:00:00.000Z",
				buildMode: "test",
			},
		});
		expect(text).toContain("PxEd Error Report");
		expect(text).toContain("Canvas failed");
		expect(text).toContain("Stack trace");
		expect(text).toContain("Component stack");
		expect(text).toContain("Route: /");
	});
});
