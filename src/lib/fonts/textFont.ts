import type { Layer, TextData } from "@/types/editor";
import { loadGoogleFont } from "@/lib/fonts/loadGoogleFont";

export function textFontWeights(text: Pick<TextData, "bold">): number[] {
	return text.bold ? [400, 700] : [400];
}

export async function loadGoogleFontForText(
	text: Pick<TextData, "font" | "bold" | "italic">,
): Promise<void> {
	await loadGoogleFont(text.font, textFontWeights(text), text.italic);
}

export async function ensureTextFonts(layers: Layer[]): Promise<void> {
	const seen = new Set<string>();
	const jobs: Promise<void>[] = [];

	for (const layer of layers) {
		if (layer.type !== "text" || !layer.textData) continue;
		const { font, bold, italic } = layer.textData;
		const key = `${font}|${bold}|${italic}`;
		if (seen.has(key)) continue;
		seen.add(key);
		jobs.push(loadGoogleFontForText(layer.textData));
	}

	await Promise.all(jobs);
}
