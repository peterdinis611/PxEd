/** Curated Google Fonts — no API key required for the picker. */
export const POPULAR_GOOGLE_FONTS = [
	"Inter",
	"Roboto",
	"Open Sans",
	"Lato",
	"Montserrat",
	"Oswald",
	"Raleway",
	"Poppins",
	"Merriweather",
	"Playfair Display",
	"Source Sans 3",
	"Nunito",
	"Ubuntu",
	"Rubik",
	"Work Sans",
	"DM Sans",
	"Manrope",
	"Space Grotesk",
	"Bebas Neue",
	"Anton",
	"Pacifico",
	"Lobster",
	"Dancing Script",
	"Caveat",
	"Permanent Marker",
	"JetBrains Mono",
	"Fira Code",
	"IBM Plex Sans",
	"IBM Plex Mono",
	"Crimson Text",
	"Libre Baskerville",
	"Bitter",
	"Archivo",
	"Outfit",
	"Sora",
	"Lexend",
	"Figtree",
	"Instrument Sans",
	"Roboto Slab",
	"Noto Sans",
] as const;

export type GoogleFontFamily = (typeof POPULAR_GOOGLE_FONTS)[number];

export const GOOGLE_FONTS_SWR_KEY = "google-fonts-catalog";

export function hasGoogleFontsApiKey(): boolean {
	return Boolean(import.meta.env.VITE_GOOGLE_FONTS_API_KEY);
}

export function filterGoogleFonts(query: string): string[] {
	const q = query.trim().toLowerCase();
	if (!q) return [...POPULAR_GOOGLE_FONTS];
	return POPULAR_GOOGLE_FONTS.filter((f) => f.toLowerCase().includes(q));
}

export function mergeFontSearchResults(
	local: string[],
	apiCatalog: string[] | undefined,
	query: string,
	limit = 48,
): string[] {
	if (!apiCatalog?.length) return local.slice(0, limit);
	const q = query.trim().toLowerCase();
	if (!q) return local.slice(0, limit);
	const fromApi = apiCatalog
		.filter((f) => f.toLowerCase().includes(q))
		.slice(0, 40);
	return [...new Set([...local, ...fromApi])].slice(0, limit);
}

/** Fetch full Google Fonts catalog (cached by useSWR). */
export async function fetchGoogleFontsCatalog(): Promise<string[]> {
	const key = import.meta.env.VITE_GOOGLE_FONTS_API_KEY as string | undefined;
	if (!key) return [];

	const url = new URL("https://www.googleapis.com/webfonts/v1/webfonts");
	url.searchParams.set("key", key);
	url.searchParams.set("sort", "popularity");

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Google Fonts API failed (${res.status})`);
	}

	const data = (await res.json()) as { items?: { family: string }[] };
	return data.items?.map((i) => i.family) ?? [];
}
