export interface ImageExifMetadata {
	orientation?: number;
	make?: string;
	model?: string;
	lensModel?: string;
	software?: string;
	/** ISO 8601-ish display string */
	dateTaken?: string;
	exposureTime?: string;
	fNumber?: number;
	iso?: number;
	focalLength?: string;
	gpsLatitude?: number;
	gpsLongitude?: number;
	imageWidth?: number;
	imageHeight?: number;
}

/** Serializable metadata captured when importing a raster file. */
export interface ImageSourceMetadata {
	fileName: string;
	fileSize: number;
	mimeType: string;
	lastModified: number;
	importedAt: number;
	originalWidth: number;
	originalHeight: number;
	orientedWidth: number;
	orientedHeight: number;
	exif?: ImageExifMetadata;
}

export interface ImageMetadataField {
	label: string;
	value: string;
}
