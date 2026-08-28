import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.List
		ref={ref}
		className={cn(
			"inline-flex h-9 items-center gap-0.5 rounded-lg bg-zinc-900/80 p-1",
			className,
		)}
		{...props}
	/>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(
			"interactive inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-ui-sm font-medium text-zinc-500",
			"hover:text-[var(--color-editor-text)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-editor-accent)]/60",
			"data-[state=active]:bg-zinc-700/90 data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm",
			"disabled:pointer-events-none disabled:opacity-40",
			className,
		)}
		{...props}
	/>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			"mt-2 focus-visible:outline-none",
			"data-[state=inactive]:hidden data-[state=inactive]:!animate-none",
			"data-[state=active]:block",
			className,
		)}
		{...props}
	/>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
