import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dismiss, getToasts, toast } from "@/lib/toast";

describe("toast", () => {
	beforeEach(() => {
		for (const item of getToasts()) dismiss(item.id);
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("adds and dismisses toasts", () => {
		const id = toast.success("Saved", "image.png");
		expect(getToasts()).toHaveLength(1);
		expect(getToasts()[0]?.title).toBe("Saved");
		dismiss(id);
		expect(getToasts()).toHaveLength(0);
	});

	it("replaces draft toast by id", () => {
		toast.draftSaving();
		toast.draftSaved();
		expect(getToasts()).toHaveLength(1);
		expect(getToasts()[0]?.title).toBe("Draft saved");
	});
});
