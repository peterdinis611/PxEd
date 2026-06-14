import type { ImageSourceMetadata } from "@/types/imageMetadata";
import { buildMetadataFields } from "@/lib/image/metadata";

export function ImageMetadataPanel({
	metadata,
}: {
	metadata: ImageSourceMetadata;
}) {
	const fields = buildMetadataFields(metadata);

	return (
		<section className="sidebar-section shrink-0 border-t border-zinc-800 px-2 py-2">
			<p className="mb-1.5 text-ui-xs font-medium text-zinc-400">Source metadata</p>
			<dl className="space-y-1">
				{fields.map((field) => (
					<div key={field.label} className="grid grid-cols-[5.5rem_1fr] gap-x-2 text-ui-xs">
						<dt className="text-zinc-600">{field.label}</dt>
						<dd className="truncate text-zinc-400" title={field.value}>
							{field.value}
						</dd>
					</div>
				))}
			</dl>
		</section>
	);
}
