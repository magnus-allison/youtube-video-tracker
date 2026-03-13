import { type FC } from 'react';

export const Logo: FC = () => {
	return (
		<h1 className='flex items-center gap-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
			<span className='flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10'>
				<svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24'>
					<path d='M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
				</svg>
			</span>

			<span className='tracking-tight'>Video Tracker</span>
		</h1>
	);
};
