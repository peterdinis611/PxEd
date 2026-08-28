import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { loadGoogleFontForText } from "@/lib/fonts/textFont";
import type { TextData } from "@/types/editor";
import type { ViewportLayout } from "@/lib/canvas/viewport";

type InlineTextEditorProps = {
	draft: TextData;
	layout: ViewportLayout;
	onChange: (patch: Partial<TextData>) => void;
	onCommit: () => void;
	onCancel: () => void;
};

export function InlineTextEditor({
	draft,
	layout,
	onChange,
	onCommit,
	onCancel,
}: InlineTextEditorProps) {
	const ref = useRef<HTMLTextAreaElement>(null);
	const screenX = draft.x * layout.scale + layout.offsetX;
	const screenY = draft.y * layout.scale + layout.offsetY;

	useEffect(() => {
		ref.current?.focus();
		ref.current?.select();
	}, []);

	useEffect(() => {
		void loadGoogleFontForText({
			font: draft.font,
			bold: draft.bold,
			italic: draft.italic,
		});
	}, [draft.font, draft.bold, draft.italic]);

	return (
		<div
			className="pointer-events-auto absolute z-30"
			style={{ left: screenX, top: screenY }}
			onMouseDown={(e) => e.stopPropagation()}
		>
			<textarea
				ref={ref}
				value={draft.text}
				onChange={(e) => onChange({ text: e.target.value })}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						e.preventDefault();
						onCancel();
					}
					if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
						e.preventDefault();
						onCommit();
					}
				}}
				className="min-h-[2.5rem] min-w-[12rem] resize rounded border border-blue-500/80 bg-zinc-950/90 px-2 py-1 text-zinc-100 shadow-lg outline-none focus:ring-2 focus:ring-blue-500/50"
				style={{
					fontFamily: draft.font,
					fontSize: Math.max(12, draft.size * layout.scale),
					fontWeight: draft.bold ? 700 : 400,
					fontStyle: draft.italic ? "italic" : "normal",
					color: draft.color,
					textAlign: draft.align as "left" | "center" | "right",
					lineHeight: `${(draft.lineHeight ?? 120) / 100}`,
					textDecoration: draft.underline ? "underline" : "none",
				}}
				rows={Math.max(2, draft.text.split("\n").length)}
			/>
			<div className="mt-1 flex gap-1">
				<Button
					size="sm"
					variant="secondary"
					className="h-6 px-2 text-[10px]"
					onClick={onCommit}
				>
					Done ⌘↵
				</Button>
				<Button
					size="sm"
					variant="ghost"
					className="h-6 px-2 text-[10px]"
					onClick={onCancel}
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}
