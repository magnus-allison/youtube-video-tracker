'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeHandleForDisplay, normalizeHandleForUrl } from '../lib/handles';
import { addRecentSearch, getRecentSearches } from '../lib/storage';
import type { Video } from '../components/VideoGrid';

interface SearchResponse {
	channelTitle?: string;
	videos?: Video[];
	continuation?: string | null;
	error?: string;
}

export function useSearchVideos() {
	const [videos, setVideos] = useState<Video[]>([]);
	const [channelTitle, setChannelTitle] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [error, setError] = useState('');
	const [continuation, setContinuation] = useState<string | null>(null);
	const [recentSearches, setRecentSearches] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState('');

	const currentHandle = useRef('');
	const searchQueryRef = useRef('');

	useEffect(() => {
		setRecentSearches(getRecentSearches());
	}, []);

	const handleSearch = useCallback(async (handle: string) => {
		const displayHandle = normalizeHandleForDisplay(handle);
		if (!displayHandle) return;

		searchQueryRef.current = displayHandle;
		setSearchQuery(displayHandle);

		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('q', normalizeHandleForUrl(displayHandle));
			window.history.replaceState({}, '', url.toString());
		}

		setIsLoading(true);
		setError('');
		setVideos([]);
		setChannelTitle('');
		setContinuation(null);
		currentHandle.current = displayHandle;

		try {
			const res = await fetch(`/api/youtube?handle=${encodeURIComponent(displayHandle)}`);
			const data = (await res.json()) as SearchResponse;

			if (!res.ok) {
				setError(data.error || 'Something went wrong');
				return;
			}

			setChannelTitle(data.channelTitle ?? '');
			setVideos(Array.isArray(data.videos) ? data.videos : []);
			setContinuation(data.continuation ?? null);
			setRecentSearches(addRecentSearch(displayHandle));
		} catch {
			setError('Failed to fetch videos. Please try again.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const applyQuery = () => {
			const query = new URLSearchParams(window.location.search).get('q');
			const trimmed = query?.trim();

			if (trimmed) {
				const displayHandle = normalizeHandleForDisplay(trimmed);
				if (displayHandle !== currentHandle.current) {
					searchQueryRef.current = displayHandle;
					setSearchQuery(displayHandle);
					handleSearch(displayHandle);
				}
				return;
			}

			if (!trimmed && searchQueryRef.current) {
				searchQueryRef.current = '';
				setSearchQuery('');
			}
		};

		applyQuery();
		window.addEventListener('popstate', applyQuery);
		return () => window.removeEventListener('popstate', applyQuery);
	}, [handleSearch]);

	const handleLoadMore = useCallback(async () => {
		if (!continuation || isLoadingMore) return;
		setIsLoadingMore(true);

		try {
			const res = await fetch(
				`/api/youtube?handle=${encodeURIComponent(currentHandle.current)}&continuation=${encodeURIComponent(continuation)}`
			);
			const data = (await res.json()) as SearchResponse;
			const nextVideos = data.videos;

			if (res.ok && Array.isArray(nextVideos)) {
				setVideos((prev) => [...prev, ...nextVideos]);
				setContinuation(data.continuation ?? null);
			}
		} catch {
			// Keep current list and let users retry load more.
		} finally {
			setIsLoadingMore(false);
		}
	}, [continuation, isLoadingMore]);

	return {
		videos,
		channelTitle,
		isLoading,
		isLoadingMore,
		error,
		continuation,
		recentSearches,
		searchQuery,
		setSearchQuery,
		handleSearch,
		handleLoadMore,
		currentHandle: currentHandle.current
	};
}
