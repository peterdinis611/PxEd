import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"interactive inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-editor-accent)]/70 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-editor-bg)] disabled:pointer-events-none disabled:opacity-40",
	{
		variants: {
			variant: {
				default:
					"bg-[var(--color-editor-accent)] text-[#1a1208] shadow-sm shadow-black/25 hover:bg-[color-mix(in_srgb,var(--color-editor-accent)_88%,white)]",
				destructive: "bg-red-600/90 text-white hover:bg-red-500",
				outline:
					"border border-[var(--color-editor-border)] bg-[var(--color-editor-panel)]/50 text-[var(--color-editor-text)] hover:border-[var(--color-editor-muted)] hover:bg-[var(--color-editor-elevated)]",
				secondary:
					"bg-[var(--color-editor-elevated)] text-[var(--color-editor-text)] hover:bg-[color-mix(in_srgb,var(--color-editor-elevated)_85%,white)]",
				ghost:
					"text-[var(--color-editor-muted)] hover:bg-[var(--color-editor-elevated)]/80 hover:text-[var(--color-editor-text)]",
				link: "text-[var(--color-editor-accent)] underline-offset-4 hover:text-[color-mix(in_srgb,var(--color-editor-accent)_80%,white)] hover:underline",
			},
			size: {
				default: "h-8 px-3 py-1 text-ui-sm",
				sm: "h-7 rounded px-2 text-ui-xs",
				lg: "h-9 rounded px-6 text-ui-sm",
				icon: "h-7 w-7",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
