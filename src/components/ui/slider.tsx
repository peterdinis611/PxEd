import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";
import { cn } from "@/lib/utils";

const sliderVariants = {
	default: {
		track: "h-1",
		thumb: "h-4 w-4",
	},
	lg: {
		track: "h-2",
		thumb: "h-5 w-5",
	},
} as const;

export type SliderSize = keyof typeof sliderVariants;

const Slider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
		size?: SliderSize;
	}
>(({ className, size = "default", ...props }, ref) => {
	const v = sliderVariants[size];
	return (
		<SliderPrimitive.Root
			ref={ref}
			className={cn(
				"relative flex w-full touch-none select-none items-center",
				className,
			)}
			{...props}
		>
			<SliderPrimitive.Track
				className={cn(
					"relative w-full grow overflow-hidden rounded-full bg-[var(--color-editor-border)]/80",
					v.track,
				)}
			>
				<SliderPrimitive.Range className="absolute h-full rounded-full bg-[var(--color-editor-accent)] transition-all duration-150" />
			</SliderPrimitive.Track>
			<SliderPrimitive.Thumb
				className={cn(
					"interactive block rounded-full border-2 border-[var(--color-editor-bg)] bg-[var(--color-editor-text)] shadow-md shadow-black/30 transition-shadow hover:shadow-[var(--color-editor-accent-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-editor-accent)]/80 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-editor-bg)]",
					v.thumb,
				)}
			/>
		</SliderPrimitive.Root>
	);
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
