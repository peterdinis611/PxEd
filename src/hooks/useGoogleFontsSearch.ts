import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
	fetchGoogleFontsCatalog,
	filterGoogleFonts,
	GOOGLE_FONTS_SWR_KEY,
	hasGoogleFontsApiKey,
	mergeFontSearchResults,
} from "@/lib/fonts/googleFontsCatalog";

type UseGoogleFontsSearchOptions = {
	/** When false, SWR key is null and no request is made. */
	enabled?: boolean;
	debounceMs?: number;
};

export function useGoogleFontsSearch(
	query: string,
	{ enabled = true, debounceMs = 280 }: UseGoogleFontsSearchOptions = {},
) {
	const [debouncedQuery, setDebouncedQuery] = useState(query);
	const apiEnabled = enabled && hasGoogleFontsApiKey();

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
		return () => clearTimeout(timer);
	}, [query, debounceMs]);

	const { data, error, isLoading, isValidating, mutate } = useSWR(
		apiEnabled ? GOOGLE_FONTS_SWR_KEY : null,
		fetchGoogleFontsCatalog,
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			dedupingInterval: 60_000,
			shouldRetryOnError: false,
		},
	);

	const options = useMemo(() => {
		const local = filterGoogleFonts(debouncedQuery);
		return mergeFontSearchResults(local, data, debouncedQuery);
	}, [debouncedQuery, data]);

	return {
		options,
		isLoading: apiEnabled && (isLoading || isValidating),
		error,
		hasApiKey: apiEnabled,
		mutate,
	};
}
