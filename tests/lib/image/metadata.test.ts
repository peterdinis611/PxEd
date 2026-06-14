import { describe, expect, it } from "vitest";
import {
	buildMetadataFields,
	extractImageMetadata,
	formatFileSize,
	getOrientedDimensions,
	normalizeExifOrientation,
} from "@/lib/image/metadata";

describe("image metadata", () => {
	it("normalizes EXIF orientation", () => {
		expect(normalizeExifOrientation(6)).toBe(6);
		expect(normalizeExifOrientation("8")).toBe(8);
		expect(normalizeExifOrientation(0)).toBe(1);
		expect(normalizeExifOrientation(99)).toBe(1);
	});

	it("swaps dimensions for rotated orientations", () => {
		expect(getOrientedDimensions(4000, 3000, 6)).toEqual({
			width: 3000,
			height: 4000,
		});
		expect(getOrientedDimensions(4000, 3000, 1)).toEqual({
			width: 4000,
			height: 3000,
		});
	});

	it("extracts basic file metadata without EXIF", async () => {
		const file = new File(["png-bytes"], "photo.png", {
			type: "image/png",
			lastModified: 1_700_000_000_000,
		});
		const meta = await extractImageMetadata(file, {
			width: 1920,
			height: 1080,
		});
		expect(meta.fileName).toBe("photo.png");
		expect(meta.mimeType).toBe("image/png");
		expect(meta.orientedWidth).toBe(1920);
		expect(meta.orientedHeight).toBe(1080);
	});

	it("formats file sizes and metadata fields", async () => {
		expect(formatFileSize(512)).toBe("512 B");
		expect(formatFileSize(2048)).toBe("2.0 KB");

		const meta = await extractImageMetadata(
			new File([new Uint8Array(4096)], "shot.jpg", { type: "image/jpeg" }),
			{ width: 100, height: 50 },
		);
		const fields = buildMetadataFields(meta);
		expect(fields.some((f) => f.label === "File" && f.value === "shot.jpg")).toBe(
			true,
		);
		expect(fields.some((f) => f.label === "Dimensions")).toBe(true);
	});
});
