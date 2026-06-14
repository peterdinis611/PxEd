import exifr from "exifr";
import type {
	ImageExifMetadata,
	ImageMetadataField,
	ImageSourceMetadata,
} from "@/types/imageMetadata";

const EXIF_PICK = [
	"Make",
	"Model",
	"LensModel",
	"Software",
	"DateTimeOriginal",
	"CreateDate",
	"ExposureTime",
	"FNumber",
	"ISO",
	"FocalLength",
	"Orientation",
	"latitude",
	"longitude",
	"ImageWidth",
	"ImageHeight",
] as const;

export function normalizeExifOrientation(value: unknown): number {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n) || n < 1 || n > 8) return 1;
	return Math.floor(n);
}

/** Display size after applying EXIF orientation (1–8). */
export function getOrientedDimensions(
	width: number,
	height: number,
	orientation = 1,
): { width: number; height: number } {
	if (orientation >= 5 && orientation <= 8) {
		return { width: height, height: width };
	}
	return { width, height };
}

function formatExposureTime(value: unknown): string | undefined {
	if (typeof value === "number") {
		if (value >= 1) return `${value}s`;
		return `1/${Math.round(1 / value)}s`;
	}
	if (typeof value === "string" && value.trim()) return value;
	return undefined;
}

function formatFocalLength(value: unknown): string | undefined {
	if (typeof value === "number") return `${value}mm`;
	if (typeof value === "string" && value.trim()) return value;
	return undefined;
}

function formatDateTaken(value: unknown): string | undefined {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "string" && value.trim()) {
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
	}
	return undefined;
}

function mapExif(raw: Record<string, unknown>): ImageExifMetadata {
	const dateTaken =
		formatDateTaken(raw.DateTimeOriginal) ??
		formatDateTaken(raw.CreateDate);

	return {
		orientation: normalizeExifOrientation(raw.Orientation),
		make: typeof raw.Make === "string" ? raw.Make : undefined,
		model: typeof raw.Model === "string" ? raw.Model : undefined,
		lensModel: typeof raw.LensModel === "string" ? raw.LensModel : undefined,
		software: typeof raw.Software === "string" ? raw.Software : undefined,
		dateTaken,
		exposureTime: formatExposureTime(raw.ExposureTime),
		fNumber: typeof raw.FNumber === "number" ? raw.FNumber : undefined,
		iso: typeof raw.ISO === "number" ? raw.ISO : undefined,
		focalLength: formatFocalLength(raw.FocalLength),
		gpsLatitude:
			typeof raw.latitude === "number" ? raw.latitude : undefined,
		gpsLongitude:
			typeof raw.longitude === "number" ? raw.longitude : undefined,
		imageWidth:
			typeof raw.ImageWidth === "number" ? raw.ImageWidth : undefined,
		imageHeight:
			typeof raw.ImageHeight === "number" ? raw.ImageHeight : undefined,
	};
}

export async function extractImageMetadata(
	file: File,
	imageSize?: { width: number; height: number },
): Promise<ImageSourceMetadata> {
	let exifRaw: Record<string, unknown> | null = null;
	try {
		exifRaw = (await exifr.parse(file, {
			pick: [...EXIF_PICK],
		})) as Record<string, unknown> | null;
	} catch {
		exifRaw = null;
	}

	const originalWidth =
		imageSize?.width ??
		(typeof exifRaw?.ImageWidth === "number" ? exifRaw.ImageWidth : 0);
	const originalHeight =
		imageSize?.height ??
		(typeof exifRaw?.ImageHeight === "number" ? exifRaw.ImageHeight : 0);
	const orientation = exifRaw
		? normalizeExifOrientation(exifRaw.Orientation)
		: 1;
	const oriented = getOrientedDimensions(
		originalWidth,
		originalHeight,
		orientation,
	);

	return {
		fileName: file.name,
		fileSize: file.size,
		mimeType: file.type || "application/octet-stream",
		lastModified: file.lastModified,
		importedAt: Date.now(),
		originalWidth,
		originalHeight,
		orientedWidth: oriented.width,
		orientedHeight: oriented.height,
		exif: exifRaw ? mapExif(exifRaw) : undefined,
	};
}

function applyExifTransform(
	ctx: CanvasRenderingContext2D,
	orientation: number,
	width: number,
	height: number,
): void {
	switch (orientation) {
		case 2:
			ctx.transform(-1, 0, 0, 1, width, 0);
			break;
		case 3:
			ctx.transform(-1, 0, 0, -1, width, height);
			break;
		case 4:
			ctx.transform(1, 0, 0, -1, 0, height);
			break;
		case 5:
			ctx.transform(0, 1, 1, 0, 0, 0);
			break;
		case 6:
			ctx.transform(0, 1, -1, 0, height, 0);
			break;
		case 7:
			ctx.transform(0, -1, -1, 0, height, width);
			break;
		case 8:
			ctx.transform(0, -1, 1, 0, 0, width);
			break;
	}
}

/** Draw image into destination canvas respecting EXIF orientation, scaled to fit. */
export function drawImageWithExifOrientation(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	destWidth: number,
	destHeight: number,
	orientation = 1,
): void {
	const srcW = img.naturalWidth;
	const srcH = img.naturalHeight;
	if (srcW < 1 || srcH < 1) return;

	const oriented = getOrientedDimensions(srcW, srcH, orientation);
	const temp = document.createElement("canvas");
	temp.width = oriented.width;
	temp.height = oriented.height;
	const tctx = temp.getContext("2d");
	if (!tctx) return;

	applyExifTransform(tctx, orientation, srcW, srcH);
	tctx.drawImage(img, 0, 0);
	ctx.drawImage(temp, 0, 0, oriented.width, oriented.height, 0, 0, destWidth, destHeight);
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatGps(lat?: number, lon?: number): string | undefined {
	if (lat == null || lon == null) return undefined;
	const latH = lat >= 0 ? "N" : "S";
	const lonH = lon >= 0 ? "E" : "W";
	return `${Math.abs(lat).toFixed(5)}° ${latH}, ${Math.abs(lon).toFixed(5)}° ${lonH}`;
}

export function formatCameraLine(exif?: ImageExifMetadata): string | undefined {
	if (!exif?.make && !exif?.model) return undefined;
	return [exif.make, exif.model].filter(Boolean).join(" ");
}

export function formatExposureLine(exif?: ImageExifMetadata): string | undefined {
	const parts: string[] = [];
	if (exif?.exposureTime) parts.push(exif.exposureTime);
	if (exif?.fNumber != null) parts.push(`f/${exif.fNumber}`);
	if (exif?.iso != null) parts.push(`ISO ${exif.iso}`);
	if (exif?.focalLength) parts.push(exif.focalLength);
	return parts.length ? parts.join(" · ") : undefined;
}

export function buildMetadataFields(
	meta: ImageSourceMetadata,
): ImageMetadataField[] {
	const fields: ImageMetadataField[] = [
		{ label: "File", value: meta.fileName },
		{ label: "Size", value: formatFileSize(meta.fileSize) },
		{ label: "Type", value: meta.mimeType },
		{
			label: "Dimensions",
			value: `${meta.orientedWidth}×${meta.orientedHeight}px`,
		},
	];

	if (
		meta.originalWidth !== meta.orientedWidth ||
		meta.originalHeight !== meta.orientedHeight
	) {
		fields.push({
			label: "Raw pixels",
			value: `${meta.originalWidth}×${meta.originalHeight}px`,
		});
	}

	if (meta.exif?.orientation && meta.exif.orientation !== 1) {
		fields.push({
			label: "EXIF orientation",
			value: String(meta.exif.orientation),
		});
	}

	const camera = formatCameraLine(meta.exif);
	if (camera) fields.push({ label: "Camera", value: camera });

	if (meta.exif?.lensModel) {
		fields.push({ label: "Lens", value: meta.exif.lensModel });
	}

	const exposure = formatExposureLine(meta.exif);
	if (exposure) fields.push({ label: "Exposure", value: exposure });

	if (meta.exif?.dateTaken) {
		fields.push({ label: "Taken", value: meta.exif.dateTaken });
	}

	if (meta.exif?.software) {
		fields.push({ label: "Software", value: meta.exif.software });
	}

	const gps = formatGps(meta.exif?.gpsLatitude, meta.exif?.gpsLongitude);
	if (gps) fields.push({ label: "GPS", value: gps });

	fields.push({
		label: "Imported",
		value: new Date(meta.importedAt).toLocaleString(),
	});

	return fields;
}
