/// <reference lib="webworker" />
import { applyImageOp, type ImageOpPayload } from "../lib/canvas/imageOpsCore";

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

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
	const { id, width, height, buffer, payload } = event.data;
	try {
		const pixels = new Uint8ClampedArray(buffer);
		applyImageOp(width, height, pixels, payload);
		const out = pixels.buffer as ArrayBuffer;
		self.postMessage({ id, buffer: out } satisfies WorkerResponse, [out]);
	} catch (err) {
		self.postMessage({
			id,
			buffer,
			error: err instanceof Error ? err.message : "Worker op failed",
		} satisfies WorkerResponse);
	}
};
