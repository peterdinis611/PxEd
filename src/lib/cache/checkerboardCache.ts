import { cache } from "react";
import { drawCheckerboard } from "@/lib/canvas/composite";

function createCheckerboardCanvas(
	width: number,
	height: number,
): HTMLCanvasElement {
	const w = Math.max(1, Math.floor(width));
	const h = Math.max(1, Math.floor(height));
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (ctx) drawCheckerboard(ctx, w, h);
	return canvas;
}

/** Memoized checkerboard tiles (React `cache`, per render tree). */
export const getCheckerboardCanvas = cache(createCheckerboardCanvas);

/** @deprecated React cache is scoped to the render; nothing to clear on the client. */
export function clearCheckerboardCache(): void {
	// Kept for API compatibility — use `unstable_useCacheRefresh` in components if needed.
}
