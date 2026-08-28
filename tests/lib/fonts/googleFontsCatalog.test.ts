import { describe, expect, it } from "vitest";
import {
	filterGoogleFonts,
	mergeFontSearchResults,
	POPULAR_GOOGLE_FONTS,
} from "@/lib/fonts/googleFontsCatalog";

describe("googleFontsCatalog", () => {
	it("filters fonts by query", () => {
		expect(filterGoogleFonts("rob")).toContain("Roboto");
		expect(filterGoogleFonts("rob")).toContain("Roboto Slab");
	});

	it("returns full list for empty query", () => {
		expect(filterGoogleFonts("")).toEqual([...POPULAR_GOOGLE_FONTS]);
	});

	it("merges local and API results", () => {
		const merged = mergeFontSearchResults(
			filterGoogleFonts("mono"),
			["Some Mono", "Roboto", "JetBrains Mono Extra"],
			"mono",
		);
		expect(merged).toContain("JetBrains Mono");
		expect(merged).toContain("Some Mono");
	});
});
