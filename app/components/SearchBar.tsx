'use client';

import { useState, FormEvent } from 'react';

interface SearchBarProps {
	onSearch: (handle: string) => void;
	isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
	const [query, setQuery] = useState('');

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const trimmed = query.trim();
		if (trimmed) onSearch(trimmed);
	}

	return (
		<form onSubmit={handleSubmit} className='w-full max-w-2xl mx-auto'>
			<div className='relative flex items-center'>
				<input
					type='text'
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder='Search YouTube handle (e.g. @mkbhd)'
					className='w-full rounded-xl border border-zinc-300 bg-white px-5 py-3.5 pr-28 text-base text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-red-500'
				/>
				<button
					type='submit'
					disabled={isLoading || !query.trim()}
					className='absolute right-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
				>
					{isLoading ? (
						<span className='flex items-center gap-2'>
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
							Loading
						</span>
					) : (
						'Search'
					)}
				</button>
			</div>
		</form>
	);
}
