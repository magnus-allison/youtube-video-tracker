'use client';

import { useMemo, useState } from 'react';
import FilterPills, { type FilterOption } from './FilterPills';
import VideoCard from './VideoCard';
import { useWatchedVideos } from '../hooks/useWatchedVideos';

export interface FeedVideo {
	id: string;
	title: string;
	thumbnail: string;
	publishedAt: string;
	channelHandle: string;
	channelTitle: string;
	isNew: boolean;
}

interface FeedGridProps {
	videos: FeedVideo[];
	isLoading: boolean;
	error: string;
	onRefresh: () => void;
	canRefresh: boolean;
	updatedAt: number | null;
}

function createdAtLabel(timestamp: number | null): string {
	if (!timestamp) return '';
	return new Date(timestamp).toLocaleString();
}

export default function FeedGrid({
	videos,
	isLoading,
	error,
	onRefresh,
	canRefresh,
	updatedAt
}: FeedGridProps) {
	const { watchedIds, toggleWatched } = useWatchedVideos();
	const [filter, setFilter] = useState<FilterOption>('all');

	const newCount = useMemo(() => videos.filter((video) => video.isNew).length, [videos]);
	const watchedCount = useMemo(
		() => videos.filter((video) => watchedIds.has(video.id)).length,
		[videos, watchedIds]
	);

	const filteredVideos = useMemo(
		() =>
			videos.filter((video) => {
				const watched = watchedIds.has(video.id);
				if (filter === 'watched') return watched;
				if (filter === 'unwatched') return !watched;
				return true;
			}),
		[videos, watchedIds, filter]
	);

	return (
		<section className='soft-reveal rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90'>
			<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
				<div>
					<h2 className='text-base font-semibold text-zinc-900 dark:text-zinc-100'>Feed</h2>
					<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
						{videos.length === 0
							? 'Fetch latest videos from all saved channels.'
							: `${videos.length} videos, ${newCount} new, ${watchedCount} watched`}
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<FilterPills value={filter} onChange={setFilter} />
					<button
						type='button'
						onClick={onRefresh}
						disabled={!canRefresh || isLoading}
						className='rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50'
					>
						{isLoading ? 'Refreshing...' : 'Refresh feed'}
					</button>
				</div>
			</div>

			{updatedAt && (
				<p className='mb-3 text-xs text-zinc-500 dark:text-zinc-400'>
					Last updated: {createdAtLabel(updatedAt)}
				</p>
			)}

			{error && (
				<div className='mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400'>
					{error}
				</div>
			)}

			{!isLoading && videos.length === 0 && !error && (
				<p className='rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400'>
					No feed videos yet. Add channels and refresh.
				</p>
			)}

			{videos.length > 0 && filteredVideos.length === 0 && !isLoading && (
				<p className='rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400'>
					No videos match this filter.
				</p>
			)}

			{filteredVideos.length > 0 && (
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{filteredVideos.map((video, index) => {
						const watched = watchedIds.has(video.id);
						const publishedLabel = video.publishedAt || 'Unknown date';
						return (
							<VideoCard
								key={`${video.channelHandle}-${video.id}`}
								id={video.id}
								title={video.title}
								thumbnail={video.thumbnail}
								publishedLabel={publishedLabel}
								channelHandle={video.channelHandle}
								channelTitle={video.channelTitle}
								isNew={video.isNew}
								watched={watched}
								onToggleWatched={toggleWatched}
								animationDelayMs={Math.min(index * 22, 176)}
							/>
						);
					})}
				</div>
			)}
		</section>
	);
}
