const loadedFamilies = new Set<string>();
const inflight = new Map<string, Promise<void>>();

function loadKey(
	family: string,
	weights: number[],
	italic: boolean,
): string {
	return `${family}|${weights.join(",")}|${italic ? 1 : 0}`;
}

function buildCssHref(
	family: string,
	weights: number[],
	italic: boolean,
): string {
	const variants = weights.flatMap((w) =>
		italic ? [`0,${w}`, `1,${w}`] : [`0,${w}`],
	);
	const familyParam = `${family.replace(/ /g, "+")}:ital,wght@${variants.join(";")}`;
	return `https://fonts.googleapis.com/css2?family=${familyParam}&display=swap`;
}

function injectStylesheet(family: string, href: string): Promise<void> {
	const existing = document.querySelector<HTMLLinkElement>(
		`link[data-gf="${CSS.escape(family)}"]`,
	);
	if (existing) {
		if (existing.href === href) return Promise.resolve();
		existing.remove();
	}

	return new Promise((resolve, reject) => {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = href;
		link.dataset.gf = family;
		link.onload = () => resolve();
		link.onerror = () => reject(new Error(`Failed to load font CSS: ${family}`));
		document.head.append(link);
	});
}

async function waitForFace(
	family: string,
	weight: number,
	style: "normal" | "italic",
	size = 16,
): Promise<void> {
	const desc = `${style} ${weight} ${size}px "${family}"`;
	try {
		await document.fonts.load(desc);
	} catch {
		// Some weights may be missing; canvas will fall back gracefully.
	}
}

/** Load a Google Font for canvas / DOM use. Cached per family + weights + italic. */
export async function loadGoogleFont(
	family: string,
	weights: number[] = [400, 700],
	italic = false,
): Promise<void> {
	const trimmed = family.trim();
	if (!trimmed) return;

	const key = loadKey(trimmed, weights, italic);
	if (loadedFamilies.has(key)) return;

	const pending = inflight.get(key);
	if (pending) return pending;

	const job = (async () => {
		const href = buildCssHref(trimmed, weights, italic);
		await injectStylesheet(trimmed, href);
		await Promise.all([
			waitForFace(trimmed, 400, "normal"),
			weights.includes(700)
				? waitForFace(trimmed, 700, "normal")
				: Promise.resolve(),
			italic ? waitForFace(trimmed, 400, "italic") : Promise.resolve(),
			italic && weights.includes(700)
				? waitForFace(trimmed, 700, "italic")
				: Promise.resolve(),
		]);
		loadedFamilies.add(key);
	})().finally(() => {
		inflight.delete(key);
	});

	inflight.set(key, job);
	return job;
}

/** Reset cache — for tests only. */
export function resetGoogleFontCacheForTests(): void {
	loadedFamilies.clear();
	inflight.clear();
}
