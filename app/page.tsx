'use client';

import { useState } from 'react';
import SearchBar from './components/SearchBar';
import VideoGrid from './components/VideoGrid';
import ChannelManager from './components/ChannelManager';
import FeedGrid from './components/FeedGrid';
import { Logo } from './components/Logo';
import { useSearchVideos } from './hooks/useSearchVideos';
import { useFeed } from './hooks/useFeed';
import { normalizeHandleForDisplay, normalizeHandleForStorage } from './lib/handles';

type Mode = 'search' | 'feed';

export default function Home() {
	const [mode, setMode] = useState<Mode>('search');
	const {
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
		currentHandle
	} = useSearchVideos();

	const {
		feedChannels,
		feedVideos,
		isFeedLoading,
		feedError,
		feedUpdatedAt,
		isChannelManagerCollapsed,
		setIsChannelManagerCollapsed,
		addFeedChannel,
		updateFeedChannel,
		removeFeedChannel,
		refreshFeed
	} = useFeed();

	const currentSearchedHandle = normalizeHandleForStorage(currentHandle);
	const currentChannelInFeed = feedChannels.includes(currentSearchedHandle);

	return (
		<div className='min-h-screen bg-zinc-50/80 font-sans dark:bg-zinc-950'>
			{/* Header */}
			<header className='sticky top-0 z-10 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80'>
				<div className='mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-4 sm:flex-row sm:gap-6'>
					<Logo />
					<div className='w-full max-w-2xl'>
						{mode === 'search' ? (
							<SearchBar
								value={searchQuery}
								onChange={setSearchQuery}
								onSearch={handleSearch}
								isLoading={isLoading}
							/>
						) : (
							<div className='min-h-10 w-full' aria-hidden='true' />
						)}
					</div>
					<div className='flex items-center gap-2'>
						<button
							type='button'
							onClick={() => setMode('search')}
							className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
								mode === 'search'
									? 'border-zinc-300 bg-zinc-100 text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
									: 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
							}`}
						>
							Search
						</button>
						<button
							type='button'
							onClick={() => setMode('feed')}
							className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
								mode === 'feed'
									? 'border-zinc-300 bg-zinc-100 text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
									: 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
							}`}
						>
							Feed
						</button>
					</div>
				</div>
			</header>

			{/* Content */}
			<main className='mx-auto max-w-6xl px-6 py-9'>
				{mode === 'search' && recentSearches.length > 0 && (
					<div className='mb-6 flex flex-wrap items-center gap-2'>
						<span className='text-xs font-medium text-zinc-400 dark:text-zinc-500'>Recent:</span>
						{recentSearches.map((handle) => (
							<button
								key={handle}
								onClick={() => handleSearch(handle)}
								disabled={isLoading}
								className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
									searchQuery.trim() === handle.trim()
										? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
										: 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800'
								}`}
							>
								{normalizeHandleForDisplay(handle)}
							</button>
						))}
					</div>
				)}

				{mode === 'search' && (
					<div className='soft-reveal'>
						{error && (
							<div className='mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400'>
								{error}
							</div>
						)}

						{!isLoading && videos.length === 0 && !error && (
							<div className='mx-auto flex max-w-xl flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-white/70 px-8 py-14 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50'>
								<svg
									className='mb-4 h-14 w-14 text-zinc-300 dark:text-zinc-700'
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
								<p className='text-lg font-medium text-zinc-600 dark:text-zinc-400'>
									Search for a YouTube handle to get started
								</p>
								<p className='mt-1 text-sm text-zinc-400 dark:text-zinc-500'>
									e.g. @mkbhd, @fireship, @ThePrimeTimeagen
								</p>
							</div>
						)}

						{isLoading && (
							<div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
								{Array.from({ length: 6 }).map((_, i) => (
									<div
										key={i}
										className='animate-pulse overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
									>
										<div className='aspect-video w-full bg-zinc-200 dark:bg-zinc-800' />
										<div className='space-y-2 p-4'>
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
							currentHandle={currentSearchedHandle}
							isInFeed={currentChannelInFeed}
							onAddToFeed={addFeedChannel}
							isAddToFeedDisabled={isFeedLoading}
						/>
					</div>
				)}

				{mode === 'feed' && (
					<div
						className={`soft-reveal grid grid-cols-1 gap-6 ${
							isChannelManagerCollapsed ? '' : 'lg:grid-cols-[360px_1fr]'
						}`}
					>
						<ChannelManager
							channels={feedChannels}
							onAdd={addFeedChannel}
							onUpdate={updateFeedChannel}
							onRemove={removeFeedChannel}
							disabled={isFeedLoading}
							isCollapsed={isChannelManagerCollapsed}
							onToggleCollapse={() => setIsChannelManagerCollapsed((prev) => !prev)}
						/>
						<FeedGrid
							videos={feedVideos}
							isLoading={isFeedLoading}
							error={feedError}
							onRefresh={refreshFeed}
							canRefresh={feedChannels.length > 0}
							updatedAt={feedUpdatedAt}
						/>
					</div>
				)}
			</main>
		</div>
	);
}
