'use client';

export type FilterOption = 'all' | 'watched' | 'unwatched';

interface FilterPillsProps {
	value: FilterOption;
	onChange: (value: FilterOption) => void;
}

const options: { value: FilterOption; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'watched', label: 'Watched' },
	{ value: 'unwatched', label: 'Unwatched' }
];

export default function FilterPills({ value, onChange }: FilterPillsProps) {
	return (
		<div className='flex flex-wrap gap-2'>
			{options.map(({ value: option, label }) => {
				const isActive = value === option;
				return (
					<button
						key={option}
						type='button'
						aria-pressed={isActive}
						onClick={() => onChange(option)}
						className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
							isActive
								? 'border-zinc-300 bg-zinc-200 text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100'
								: 'border-zinc-200 bg-white/20 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
						}`}
					>
						{label}
					</button>
				);
			})}
		</div>
	);
}
