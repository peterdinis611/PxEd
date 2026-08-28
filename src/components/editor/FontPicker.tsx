import { ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGoogleFontsSearch } from "@/hooks/useGoogleFontsSearch";
import { loadGoogleFontForText } from "@/lib/fonts/textFont";
import { cn } from "@/lib/utils";

type FontPickerProps = {
	value: string;
	bold: boolean;
	italic: boolean;
	onChange: (family: string) => void;
	className?: string;
};

export function FontPicker({
	value,
	bold,
	italic,
	onChange,
	className,
}: FontPickerProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [loadingFamily, setLoadingFamily] = useState<string | null>(null);
	const [previewFamily, setPreviewFamily] = useState<string | null>(null);

	const { options, isLoading: catalogLoading, hasApiKey } = useGoogleFontsSearch(
		query,
		{ enabled: open },
	);

	const loadPreview = useCallback(
		async (family: string) => {
			setPreviewFamily(family);
			try {
				await loadGoogleFontForText({ font: family, bold, italic });
			} catch {
				// Preview can fall back to system font.
			}
		},
		[bold, italic],
	);

	const pick = async (family: string) => {
		setLoadingFamily(family);
		try {
			await loadGoogleFontForText({ font: family, bold, italic });
			onChange(family);
			setOpen(false);
			setQuery("");
		} finally {
			setLoadingFamily(null);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"h-7 min-w-[9rem] max-w-[11rem] justify-between px-2 text-ui-xs font-normal",
						className,
					)}
				>
					<span className="truncate" style={{ fontFamily: `"${value}"` }}>
						{value}
					</span>
					<ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-64 p-2">
				<div className="relative mb-2">
					<Input
						placeholder="Search Google Fonts…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="h-8 pr-8 text-ui-xs"
						autoFocus
					/>
					{catalogLoading ? (
						<Loader2 className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-zinc-500" />
					) : null}
				</div>
				<ul className="smooth-scroll max-h-56 overflow-y-auto rounded-md border border-zinc-700/80 bg-zinc-950/40">
					{options.map((family) => (
						<li key={family}>
							<button
								type="button"
								className={cn(
									"interactive flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-ui-xs text-zinc-200 hover:bg-zinc-700/60",
									family === value && "bg-blue-500/15 text-blue-200",
								)}
								style={{
									fontFamily:
										previewFamily === family ? `"${family}"` : undefined,
								}}
								onMouseEnter={() => void loadPreview(family)}
								onClick={() => void pick(family)}
							>
								<span className="truncate">{family}</span>
								{loadingFamily === family ? (
									<Loader2 className="h-3 w-3 shrink-0 animate-spin" />
								) : null}
							</button>
						</li>
					))}
					{options.length === 0 ? (
						<li className="px-2 py-3 text-center text-ui-xs text-zinc-500">
							No fonts found
						</li>
					) : null}
				</ul>
				<p className="mt-2 text-[10px] leading-snug text-zinc-500">
					{hasApiKey
						? "Full catalog via Google Fonts API (cached)."
						: "Popular fonts only — set VITE_GOOGLE_FONTS_API_KEY for full search."}
				</p>
			</PopoverContent>
		</Popover>
	);
}
