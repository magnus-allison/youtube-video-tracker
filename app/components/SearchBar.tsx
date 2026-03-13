'use client';

import { useState, useEffect, FormEvent } from 'react';

interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
	onSearch: (handle: string) => void;
	isLoading: boolean;
}

export default function SearchBar({ value, onChange, onSearch, isLoading }: SearchBarProps) {
	const [query, setQuery] = useState(value);

	useEffect(() => {
		setQuery(value);
	}, [value]);

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const trimmed = query.trim();
		if (trimmed) onSearch(trimmed);
	}

	return (
		<form onSubmit={handleSubmit} className='w-full max-w-2xl mx-auto'>
			<div className='relative flex items-center'>
				<span className='pointer-events-none absolute left-4 text-zinc-400 dark:text-zinc-500'>
					<svg
						className='h-4 w-4'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
						strokeWidth={1.6}
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
						/>
					</svg>
				</span>
				<input
					type='text'
					value={query}
					onChange={(e) => {
						const rawValue = e.target.value;
						const nextValue = rawValue && !rawValue.startsWith('@') ? `@${rawValue}` : rawValue;

						setQuery(nextValue);
						onChange(nextValue);
					}}
					placeholder='Search YouTube handle (e.g. @mkbhd)'
					className='
						w-full
						rounded-2xl
						border border-zinc-200
						bg-white
						px-10 py-3.5 pr-32
						text-sm text-zinc-900
						shadow-sm
						outline-none
						transition
						placeholder:text-zinc-400
						focus:border-red-500
						focus:ring-4 focus:ring-red-500/10
						dark:border-zinc-800
						dark:bg-zinc-900
						dark:text-zinc-100
						dark:placeholder:text-zinc-500
					'
				/>

				<button
					type='submit'
					disabled={isLoading || !query.trim()}
					className='
						absolute right-2
						flex items-center justify-center gap-2
						rounded-xl
						bg-linear-to-r from-red-500 to-red-600
						px-5 py-2
						text-sm font-semibold text-white
						shadow-sm
						transition-all
						hover:from-red-600 hover:to-red-700
						active:scale-[0.98]
						disabled:cursor-not-allowed
						disabled:opacity-50
					'
				>
					{isLoading ? (
						<>
							<svg className='h-4 w-4 animate-spin' viewBox='0 0 24 24' fill='none'>
								<circle
									cx='12'
									cy='12'
									r='10'
									stroke='currentColor'
									strokeWidth='3'
									className='opacity-25'
								/>
								<path
									fill='currentColor'
									className='opacity-75'
									d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'
								/>
							</svg>
							Loading
						</>
					) : (
						'Search'
					)}
				</button>
			</div>
		</form>
	);
}
