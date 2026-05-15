'use client';

interface VideoCardProps {
	id: string;
	title: string;
	thumbnail: string;
	publishedLabel: string;
	channelHandle?: string;
	channelTitle?: string;
	isNew?: boolean;
	watched: boolean;
	onToggleWatched: (id: string) => void;
	animationDelayMs?: number;
}

export default function VideoCard({
	id,
	title,
	thumbnail,
	publishedLabel,
	channelHandle,
	channelTitle,
	isNew,
	watched,
	onToggleWatched,
	animationDelayMs = 0
}: VideoCardProps) {
	return (
		<div
			className={`soft-reveal group flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-all hover:-translate-y-px hover:shadow-md ${
				watched
					? 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30'
					: 'border-zinc-200/90 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900'
			}`}
			style={{ animationDelay: `${animationDelayMs}ms` }}
		>
			<a
				href={`https://www.youtube.com/watch?v=${id}`}
				target='_blank'
				rel='noopener noreferrer'
				className='flex flex-1 flex-col'
			>
				<div className='relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800'>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={thumbnail}
						alt={title}
						className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${watched ? 'opacity-60' : ''}`}
					/>
					{channelHandle && (
						<div className='absolute left-2 top-2 rounded-md bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-white'>
							{channelHandle}
						</div>
					)}
					<div className='absolute right-2 top-2 flex items-center gap-1'>
						{isNew && (
							<div className='rounded-md bg-green-600 px-2 py-0.5 text-[11px] font-semibold text-white'>
								New
							</div>
						)}
						{watched && (
							<div className='rounded-md bg-zinc-900/80 px-2 py-0.5 text-[11px] font-semibold text-white'>
								Watched
							</div>
						)}
					</div>
					<div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100'>
						<div className='rounded-full bg-red-600/90 p-3'>
							<svg className='h-6 w-6 text-white' fill='currentColor' viewBox='0 0 24 24'>
								<path d='M8 5v14l11-7z' />
							</svg>
						</div>
					</div>
				</div>

				<div className='flex flex-1 flex-col p-4 pb-2'>
					<h3 className='line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100'>
						{title}
					</h3>
					<div className='mt-auto space-y-1 pt-3 text-xs text-zinc-500 dark:text-zinc-400'>
						{channelTitle && (
							<p className='truncate'>
								<span className='font-medium text-zinc-700 dark:text-zinc-200'>
									Channel:{' '}
								</span>
								{channelTitle}
							</p>
						)}
						<p>
							<span className='font-medium text-zinc-700 dark:text-zinc-200'>Published: </span>
							{publishedLabel}
						</p>
					</div>
				</div>
			</a>

			<div className='border-t border-zinc-200/80 px-4 pb-3 pt-2 dark:border-zinc-800'>
				<button
					type='button'
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onToggleWatched(id);
					}}
					className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
						watched
							? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400 dark:hover:bg-green-900/60'
							: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
					}`}
				>
					{watched ? '✓ Watched' : 'Mark watched'}
				</button>
			</div>
		</div>
	);
}
