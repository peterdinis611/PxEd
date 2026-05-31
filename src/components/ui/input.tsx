import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
	({ className, type, ...props }, ref) => (
		<input
			type={type}
			className={cn(
				"interactive flex h-8 w-full rounded border border-zinc-700/80 bg-zinc-950/50 px-2 py-1 text-ui-sm text-zinc-100",
				"placeholder:text-zinc-600 focus-visible:border-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
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
