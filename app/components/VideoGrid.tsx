'use client';

import { useEffect, useRef, useState } from 'react';
import FilterPills, { type FilterOption } from './FilterPills';
import VideoCard from './VideoCard';
import { useWatchedVideos } from '../hooks/useWatchedVideos';

export interface Video {
	id: string;
	title: string;
	description: string;
	thumbnail: string;
	publishedAt: string;
}

interface VideoGridProps {
	videos: Video[];
	channelTitle?: string;
	onLoadMore?: () => void;
	isLoadingMore?: boolean;
	currentHandle?: string;
	isInFeed?: boolean;
	onAddToFeed?: (handle: string) => void;
	isAddToFeedDisabled?: boolean;
}

function timeAgo(dateString: string): string {
	// If already a relative string (from YouTube page scraping), return as-is
	if (!dateString || isNaN(Date.parse(dateString))) {
		return dateString || '';
	}
	const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
	const intervals: [number, string][] = [
		[31536000, 'year'],
		[2592000, 'month'],
		[604800, 'week'],
		[86400, 'day'],
		[3600, 'hour'],
		[60, 'minute']
	];
	for (const [secs, label] of intervals) {
		const count = Math.floor(seconds / secs);
		if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
	}
	return 'just now';
}

export default function VideoGrid({
	videos,
	channelTitle,
	onLoadMore,
	isLoadingMore,
	currentHandle,
	isInFeed,
	onAddToFeed,
	isAddToFeedDisabled
}: VideoGridProps) {
	const { watchedIds, toggleWatched } = useWatchedVideos();
	const [filter, setFilter] = useState<FilterOption>('all');
	const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
	const isLoadingMoreRef = useRef(!!isLoadingMore);
	const allowAutoLoad = filter === 'all';

	useEffect(() => {
		isLoadingMoreRef.current = !!isLoadingMore;
	}, [isLoadingMore]);

	useEffect(() => {
		if (!onLoadMore) return;
		if (!allowAutoLoad) return;
		if (typeof window === 'undefined') return;
		if (!('IntersectionObserver' in window)) return;
		const sentinel = loadMoreSentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry?.isIntersecting) return;
				if (isLoadingMoreRef.current) return;
				isLoadingMoreRef.current = true;
				onLoadMore();
			},
			{ rootMargin: '300px 0px', threshold: 0.01 }
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [onLoadMore, allowAutoLoad]);

	if (videos.length === 0) return null;

	const filteredVideos = videos.filter((video) => {
		const watched = watchedIds.has(video.id);
		if (filter === 'watched') return watched;
		if (filter === 'unwatched') return !watched;
		return true;
	});

	return (
		<div className='w-full'>
			{channelTitle && currentHandle && (
				<div className='mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/60'>
					<p className='text-sm text-zinc-600 dark:text-zinc-300'>
						{isInFeed ? 'This channel is in your feed.' : 'This channel is not in your feed yet.'}
					</p>
					<button
						type='button'
						onClick={() => onAddToFeed?.(currentHandle)}
						disabled={isInFeed || isAddToFeedDisabled}
						className='rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isInFeed ? 'Added to feed' : 'Add to feed'}
					</button>
				</div>
			)}

			{channelTitle && (
				<div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
					<h2 className='flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
						<span className='text-zinc-400 dark:text-zinc-500'>Latest from</span>
						<span className='font-semibold text-red-600'>@{channelTitle}</span>
					</h2>
					<FilterPills value={filter} onChange={setFilter} />
				</div>
			)}
			<div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
				{filteredVideos.map((video, index) => {
					const watched = watchedIds.has(video.id);
					const publishedLabel = timeAgo(video.publishedAt);
					return (
						<VideoCard
							key={video.id}
							id={video.id}
							title={video.title}
							thumbnail={video.thumbnail}
							publishedLabel={publishedLabel}
							channelTitle={channelTitle}
							watched={watched}
							onToggleWatched={toggleWatched}
							animationDelayMs={Math.min(index * 24, 180)}
						/>
					);
				})}
			</div>

			{onLoadMore && (
				<div className='mt-8 flex flex-col items-center gap-3'>
					<div ref={loadMoreSentinelRef} className='h-1 w-full' aria-hidden='true' />
					<button
						onClick={onLoadMore}
						disabled={isLoadingMore}
						className='inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-700'
					>
						{isLoadingMore ? (
							<>
								<svg className='h-4 w-4 animate-spin' viewBox='0 0 24 24' fill='none'>
									<circle
										className='opacity-25'
										cx='12'
										cy='12'
										r='10'
										stroke='currentColor'
										strokeWidth='4'
									/>
									<path
										className='opacity-75'
										fill='currentColor'
										d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
									/>
								</svg>
								Loading…
							</>
						) : (
							'Load More'
						)}
					</button>
				</div>
			)}
		</div>
	);
}
