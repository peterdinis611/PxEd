import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
	({ className, type, ...props }, ref) => (
		<input
			type={type}
			className={cn(
				"interactive flex h-8 w-full rounded border border-[var(--color-editor-border)] bg-[var(--color-editor-bg)]/60 px-2 py-1 text-ui-sm text-[var(--color-editor-text)]",
				"placeholder:text-[var(--color-editor-muted)] focus-visible:border-[color-mix(in_srgb,var(--color-editor-accent)_50%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-editor-accent-glow)]",
				"disabled:cursor-not-allowed disabled:opacity-40",
				className,
			)}
			ref={ref}
			{...props}
		/>
	),
);
Input.displayName = "Input";

export { Input };
