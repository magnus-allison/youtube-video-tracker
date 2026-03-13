'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import VideoGrid, { Video } from './components/VideoGrid';
import { getRecentSearches, addRecentSearch } from './lib/storage';
import { Logo } from './components/Logo';

function normalizeHandleForDisplay(handle: string): string {
	const trimmed = handle.trim();
	if (!trimmed) return '';
	return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function normalizeHandleForUrl(handle: string): string {
	const trimmed = handle.trim();
	if (!trimmed) return '';
	return trimmed.replace(/^@+/, '');
}

export default function Home() {
	const [videos, setVideos] = useState<Video[]>([]);
	const [channelTitle, setChannelTitle] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [error, setError] = useState('');
	const [continuation, setContinuation] = useState<string | null>(null);
	const currentHandle = useRef('');
	const [recentSearches, setRecentSearches] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		setRecentSearches(getRecentSearches());
	}, []);

	const handleSearch = useCallback(async (handle: string) => {
		const displayHandle = normalizeHandleForDisplay(handle);
		if (!displayHandle) return;
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
			const data = await res.json();

			if (!res.ok) {
				setError(data.error || 'Something went wrong');
				return;
			}

			setChannelTitle(data.channelTitle);
			setVideos(data.videos);
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
					setSearchQuery(displayHandle);
					handleSearch(displayHandle);
				}
				return;
			}
			if (!trimmed && searchQuery) {
				setSearchQuery('');
			}
		};

		applyQuery();
		window.addEventListener('popstate', applyQuery);
		return () => window.removeEventListener('popstate', applyQuery);
	}, [handleSearch, searchQuery]);

	async function handleLoadMore() {
		if (!continuation || isLoadingMore) return;
		setIsLoadingMore(true);

		try {
			const res = await fetch(
				`/api/youtube?handle=${encodeURIComponent(currentHandle.current)}&continuation=${encodeURIComponent(continuation)}`
			);
			const data = await res.json();

			if (res.ok) {
				setVideos((prev) => [...prev, ...data.videos]);
				setContinuation(data.continuation ?? null);
			}
		} catch {
			// silently fail for load more
		} finally {
			setIsLoadingMore(false);
		}
	}

	return (
		<div className='min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950'>
			{/* Header */}
			<header className='sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80'>
				<div className='mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-5 sm:flex-row sm:gap-6'>
					<Logo />
					<SearchBar
						value={searchQuery}
						onChange={setSearchQuery}
						onSearch={handleSearch}
						isLoading={isLoading}
					/>
				</div>
				{recentSearches.length > 0 && (
					<div className='mx-auto flex max-w-6xl items-center gap-2 px-6 pb-3 pt-0'>
						<span className='text-xs text-zinc-400 dark:text-zinc-500'>Recent:</span>
						{recentSearches.map((handle) => (
							<button
								key={handle}
								onClick={() => handleSearch(handle)}
								disabled={isLoading}
								className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
									searchQuery.trim() === handle.trim()
										? 'border-red-300 bg-red-50 text-red-700 hover:border-red-400 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:border-red-700'
										: 'border-zinc-200 bg-white text-zinc-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-400'
								}`}
							>
								{normalizeHandleForDisplay(handle)}
							</button>
						))}
					</div>
				)}
			</header>

			{/* Content */}
			<main className='mx-auto max-w-6xl px-6 py-8'>
				{error && (
					<div className='mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400'>
						{error}
					</div>
				)}

				{!isLoading && videos.length === 0 && !error && (
					<div className='flex flex-col items-center justify-center py-32 text-center'>
						<svg
							className='mb-4 h-16 w-16 text-zinc-300 dark:text-zinc-700'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							strokeWidth={1.5}
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
							/>
						</svg>
						<p className='text-lg font-medium text-zinc-500 dark:text-zinc-400'>
							Search for a YouTube handle to get started
						</p>
						<p className='mt-1 text-sm text-zinc-400 dark:text-zinc-500'>
							e.g. @mkbhd, @fireship, @ThePrimeTimeagen
						</p>
					</div>
				)}

				{isLoading && (
					<div className='grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
						{Array.from({ length: 6 }).map((_, i) => (
							<div
								key={i}
								className='animate-pulse overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
							>
								<div className='aspect-video w-full bg-zinc-200 dark:bg-zinc-800' />
								<div className='p-4 space-y-2'>
									<div className='h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800' />
									<div className='h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800' />
									<div className='h-3 w-1/4 rounded bg-zinc-200 dark:bg-zinc-800' />
								</div>
							</div>
						))}
					</div>
				)}

				<VideoGrid
					videos={videos}
					channelTitle={channelTitle}
					onLoadMore={continuation ? handleLoadMore : undefined}
					isLoadingMore={isLoadingMore}
				/>
			</main>
		</div>
	);
}
