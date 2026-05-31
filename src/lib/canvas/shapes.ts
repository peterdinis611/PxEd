/** Draw a line with an arrowhead at (x1, y1). */
export function drawArrow(
	ctx: CanvasRenderingContext2D,
	x0: number,
	y0: number,
	x1: number,
	y1: number,
	lineWidth: number,
	lineCap: CanvasLineCap = "round",
): void {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const len = Math.hypot(dx, dy);
	if (len < 1) return;

	const ux = dx / len;
	const uy = dy / len;
	const head = Math.max(8, lineWidth * 4);
	const shaftEndX = x1 - ux * head * 0.85;
	const shaftEndY = y1 - uy * head * 0.85;

	ctx.lineCap = lineCap;
	ctx.beginPath();
	ctx.moveTo(x0, y0);
	ctx.lineTo(shaftEndX, shaftEndY);
	ctx.stroke();

	const perpX = -uy;
	const perpY = ux;
	const half = head * 0.45;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(shaftEndX + perpX * half, shaftEndY + perpY * half);
	ctx.lineTo(shaftEndX - perpX * half, shaftEndY - perpY * half);
	ctx.closePath();
	ctx.fill();
}
