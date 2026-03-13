'use client';

import { useState, useCallback } from 'react';
import { getStorageItem, setStorageItem } from '../lib/storage';

const WATCHED_KEY = 'yt-tracker-watched';

function getWatchedIds(): Set<string> {
	return new Set(getStorageItem<string[]>(WATCHED_KEY, []));
}

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

export default function VideoGrid({ videos, channelTitle, onLoadMore, isLoadingMore }: VideoGridProps) {
	const [watchedIds, setWatchedIds] = useState<Set<string>>(() => getWatchedIds());

	const toggleWatched = useCallback((id: string, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setWatchedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			setStorageItem(WATCHED_KEY, [...next]);
			return next;
		});
	}, []);

	if (videos.length === 0) return null;

	return (
		<div className='w-full'>
			{channelTitle && (
				<h2 className='mb-6 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
					<span className='text-zinc-200 dark:text-zinc-200'>Latest from</span>
					<span className='text-red-600 font-semibold'>@{channelTitle}</span>
				</h2>
			)}
			<div className='grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
				{videos.map((video) => {
					const watched = watchedIds.has(video.id);
					return (
						<div
							key={video.id}
							className={`group overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
								watched
									? 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30'
									: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
							}`}
						>
							<a
								href={`https://www.youtube.com/watch?v=${video.id}`}
								target='_blank'
								rel='noopener noreferrer'
							>
								<div className='relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800'>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={video.thumbnail}
										alt={video.title}
										className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${watched ? 'opacity-60' : ''}`}
									/>
									{watched && (
										<div className='absolute top-2 right-2 rounded-full bg-green-600 p-1'>
											<svg
												className='h-3.5 w-3.5 text-white'
												fill='none'
												viewBox='0 0 24 24'
												stroke='currentColor'
												strokeWidth={3}
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													d='M5 13l4 4L19 7'
												/>
											</svg>
										</div>
									)}
									<div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100'>
										<div className='rounded-full bg-red-600/90 p-3'>
											<svg
												className='h-6 w-6 text-white'
												fill='currentColor'
												viewBox='0 0 24 24'
											>
												<path d='M8 5v14l11-7z' />
											</svg>
										</div>
									</div>
								</div>
								<div className='p-4 pb-2'>
									<h3 className='line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100'>
										{video.title}
									</h3>
									<p className='mt-1.5 text-xs text-zinc-500 dark:text-zinc-400'>
										{timeAgo(video.publishedAt)}
									</p>
								</div>
							</a>
							<div className='px-4 pb-3'>
								<button
									onClick={(e) => toggleWatched(video.id, e)}
									className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
										watched
											? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400 dark:hover:bg-green-900/60'
											: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
									}`}
								>
									{watched ? '✓ Watched' : 'Mark as watched'}
								</button>
							</div>
						</div>
					);
				})}
			</div>

			{onLoadMore && (
				<div className='mt-8 flex justify-center'>
					<button
						onClick={onLoadMore}
						disabled={isLoadingMore}
						className='inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
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
