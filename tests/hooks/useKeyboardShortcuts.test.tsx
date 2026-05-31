import { HotkeysProvider } from "@tanstack/react-hotkeys";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorProvider } from "@/context/EditorContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

function wrapper({ children }: { children: React.ReactNode }) {
	return (
		<HotkeysProvider>
			<EditorProvider>{children}</EditorProvider>
		</HotkeysProvider>
	);
}

describe("useKeyboardShortcuts", () => {
	it("registers without throwing inside providers", () => {
		const setSpacePan = vi.fn();
		expect(() =>
			renderHook(
				() =>
					useKeyboardShortcuts(
						setSpacePan,
						vi.fn(),
						vi.fn(),
						vi.fn(),
						vi.fn(),
						vi.fn(),
					),
				{ wrapper },
			),
		).not.toThrow();
	});
});
