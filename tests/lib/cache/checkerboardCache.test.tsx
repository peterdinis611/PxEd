import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getCheckerboardCanvas } from "@/lib/cache/checkerboardCache";

function Tile({ w, h }: { w: number; h: number }) {
	const canvas = getCheckerboardCanvas(w, h);
	return (
		<span data-testid="size">
			{canvas.width}x{canvas.height}
		</span>
	);
}

describe("getCheckerboardCanvas", () => {
	it("creates a checkerboard canvas at the requested size", () => {
		const { getByTestId } = render(<Tile w={64} h={48} />);
		expect(getByTestId("size").textContent).toBe("64x48");
	});
});
