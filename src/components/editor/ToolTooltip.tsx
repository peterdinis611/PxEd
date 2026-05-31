import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function ToolTooltip({
	label,
	description,
	shortcut,
	side = "right",
	children,
}: {
	label: string;
	description: string;
	shortcut?: string;
	side?: "top" | "right" | "bottom" | "left";
	children: React.ReactNode;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent side={side} className="max-w-[220px]">
				<p className="text-ui-sm font-medium text-zinc-100">{label}</p>
				<p className="mt-0.5 text-ui-xs leading-snug text-zinc-400">
					{description}
				</p>
				{shortcut ? (
					<p className="mt-1.5 text-ui-xs text-zinc-500">
						Shortcut:{" "}
						<kbd className="rounded bg-zinc-700/90 px-1 py-0.5 font-mono text-zinc-300">
							{shortcut}
						</kbd>
					</p>
				) : null}
			</TooltipContent>
		</Tooltip>
	);
}
