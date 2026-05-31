export interface ErrorContext {
	route?: string;
	url?: string;
	userAgent?: string;
	timestamp?: string;
	viewport?: string;
	buildMode?: string;
}

export interface ErrorReport {
	error: Error;
	componentStack?: string | null;
	context?: ErrorContext;
}

export function buildErrorContext(route?: string): ErrorContext {
	const now = new Date();
	return {
		route:
			route ??
			(typeof window !== "undefined" ? window.location.pathname : undefined),
		url: typeof window !== "undefined" ? window.location.href : undefined,
		userAgent:
			typeof navigator !== "undefined" ? navigator.userAgent : undefined,
		timestamp: now.toISOString(),
		viewport:
			typeof window !== "undefined"
				? `${window.innerWidth}×${window.innerHeight} (@${window.devicePixelRatio}x)`
				: undefined,
		buildMode: import.meta.env.MODE,
	};
}

export function formatErrorReport({
	error,
	componentStack,
	context,
}: ErrorReport): string {
	const lines: string[] = ["PxEd Error Report", "=================", ""];

	if (context) {
		lines.push("Context", "-------");
		if (context.timestamp) lines.push(`Time: ${context.timestamp}`);
		if (context.route) lines.push(`Route: ${context.route}`);
		if (context.url) lines.push(`URL: ${context.url}`);
		if (context.viewport) lines.push(`Viewport: ${context.viewport}`);
		if (context.buildMode) lines.push(`Mode: ${context.buildMode}`);
		if (context.userAgent) lines.push(`User-Agent: ${context.userAgent}`);
		lines.push("");
	}

	lines.push(
		"Error",
		"-----",
		`Name: ${error.name}`,
		`Message: ${error.message}`,
	);

	if (error.stack) {
		lines.push("", "Stack trace", "-----------", error.stack);
	}

	if (componentStack?.trim()) {
		lines.push(
			"",
			"Component stack",
			"----------------",
			componentStack.trim(),
		);
	}

	return lines.join("\n");
}
