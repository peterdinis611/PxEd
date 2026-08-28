import { useEffect, useState } from "react";
import { useEditor } from "@/context/EditorContext";
import {
	applyImageOp,
	type ImageOpPayload,
} from "@/lib/canvas/imageOpsCore";
import { cn } from "@/lib/utils";

type GalleryItem = {
	id: string;
	label: string;
	payload: ImageOpPayload;
};

const GALLERY: GalleryItem[] = [
	{ id: "sharpen", label: "Sharpen", payload: { op: "sharpen" } },
	{ id: "emboss", label: "Emboss", payload: { op: "emboss" } },
	{ id: "grayscale", label: "Gray", payload: { op: "grayscale" } },
	{ id: "invert", label: "Invert", payload: { op: "invert" } },
	{ id: "blur", label: "Blur", payload: { op: "blur", radius: 4 } },
	{ id: "noise", label: "Noise", payload: { op: "noise", amount: 20 } },
	{ id: "pixelate", label: "Pixel", payload: { op: "pixelate", cellSize: 8 } },
];

const THUMB = 56;

function buildThumb(
	source: HTMLCanvasElement,
	payload: ImageOpPayload,
): string | null {
	const scale = Math.min(THUMB / source.width, THUMB / source.height, 1);
	const w = Math.max(1, Math.round(source.width * scale));
	const h = Math.max(1, Math.round(source.height * scale));
	const c = document.createElement("canvas");
	c.width = w;
	c.height = h;
	const ctx = c.getContext("2d");
	if (!ctx) return null;
	ctx.drawImage(source, 0, 0, w, h);
	const imageData = ctx.getImageData(0, 0, w, h);
	applyImageOp(w, h, imageData.data, payload);
	ctx.putImageData(imageData, 0, 0);
	return c.toDataURL("image/png");
}

export function FiltersGallery({ disabled }: { disabled?: boolean }) {
	const { activeLayer, runActiveLayerImageOp, state } = useEditor();
	const [urls, setUrls] = useState<Record<string, string>>({});
	const [busy, setBusy] = useState<string | null>(null);

	useEffect(() => {
		if (!activeLayer || disabled) {
			setUrls({});
			return;
		}
		const next: Record<string, string> = {};
		for (const item of GALLERY) {
			const url = buildThumb(activeLayer.canvas, item.payload);
			if (url) next[item.id] = url;
		}
		setUrls(next);
	}, [activeLayer, disabled, state.renderTick]);

	if (!activeLayer || disabled) return null;

	return (
		<div className="grid grid-cols-3 gap-1.5">
			{GALLERY.map((item) => (
				<button
					key={item.id}
					type="button"
					disabled={busy !== null}
					className={cn(
						"interactive flex flex-col items-center gap-1 rounded border border-zinc-800 bg-zinc-900/80 p-1.5 text-ui-xs text-zinc-400 transition-colors",
						"hover:border-zinc-600 hover:text-zinc-200",
						busy === item.id && "border-blue-500/50 text-blue-300",
					)}
					onClick={() => {
						setBusy(item.id);
						void runActiveLayerImageOp(item.payload, item.label).finally(() =>
							setBusy(null),
						);
					}}
				>
					{urls[item.id] ? (
						<img
							src={urls[item.id]}
							alt=""
							width={THUMB}
							height={THUMB}
							className="size-14 rounded-sm object-cover ring-1 ring-zinc-700/80"
						/>
					) : (
						<div className="size-14 rounded-sm bg-zinc-800" />
					)}
					<span>{item.label}</span>
				</button>
			))}
		</div>
	);
}
