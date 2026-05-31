import "react";

declare module "react" {
	// React 19 — available at runtime; @types/react may lag behind.
	export function cache<Args extends readonly unknown[], Return>(
		fn: (...args: Args) => Return,
	): (...args: Args) => Return;

	export function cacheSignal(): null | AbortSignal;

	export function unstable_useCacheRefresh(): () => void;
}
