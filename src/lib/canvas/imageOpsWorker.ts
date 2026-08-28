import type { ImageOpPayload } from "@/lib/canvas/imageOpsCore";
import { applyImageOp } from "@/lib/canvas/imageOpsCore";

type WorkerRequest = {
	id: number;
	width: number;
	height: number;
	buffer: ArrayBuffer;
	payload: ImageOpPayload;
};

type WorkerResponse = {
	id: number;
	buffer: ArrayBuffer;
	error?: string;
};

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<
	number,
	{ resolve: (buf: ArrayBuffer) => void; reject: (err: Error) => void }
>();

function getWorker(): Worker | null {
	if (typeof Worker === "undefined") return null;
	if (worker) return worker;
	try {
		worker = new Worker(
			new URL("../../workers/imageOps.worker.ts", import.meta.url),
			{ type: "module" },
		);
		worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
			const { id, buffer, error } = event.data;
			const job = pending.get(id);
			if (!job) return;
			pending.delete(id);
			if (error) job.reject(new Error(error));
			else job.resolve(buffer);
		};
		worker.onerror = () => {
			for (const [, job] of pending) {
				job.reject(new Error("Image worker crashed"));
			}
			pending.clear();
			worker = null;
		};
		return worker;
	} catch {
		return null;
	}
}

/** Run a pixel op off the main thread when possible; falls back to sync. */
export async function runImageOpOnCanvas(
	ctx: CanvasRenderingContext2D,
	payload: ImageOpPayload,
): Promise<void> {
	const { width, height } = ctx.canvas;
	const imageData = ctx.getImageData(0, 0, width, height);
	const w = getWorker();

	if (!w) {
		applyImageOp(width, height, imageData.data, payload);
		ctx.putImageData(imageData, 0, 0);
		return;
	}

	const id = ++seq;
	const buffer = imageData.data.buffer.slice(0) as ArrayBuffer;

	const result = await new Promise<ArrayBuffer>((resolve, reject) => {
		pending.set(id, { resolve, reject });
		const msg: WorkerRequest = { id, width, height, buffer, payload };
		w.postMessage(msg, [buffer]);
	});

	const out = new ImageData(new Uint8ClampedArray(result), width, height);
	ctx.putImageData(out, 0, 0);
}

export type { ImageOpPayload };
