'use client';

import { useMemo, useState } from 'react';
import { normalizeHandleForDisplay } from '../lib/handles';

interface ChannelManagerProps {
	channels: string[];
	onAdd: (handle: string) => boolean;
	onUpdate: (previousHandle: string, nextHandle: string) => boolean;
	onRemove: (handle: string) => void;
	disabled?: boolean;
	isCollapsed: boolean;
	onToggleCollapse: () => void;
}

export default function ChannelManager({
	channels,
	onAdd,
	onUpdate,
	onRemove,
	disabled = false,
	isCollapsed,
	onToggleCollapse
}: ChannelManagerProps) {
	const [newHandle, setNewHandle] = useState('');
	const [editingHandle, setEditingHandle] = useState<string | null>(null);
	const [editingValue, setEditingValue] = useState('');
	const [error, setError] = useState('');

	const sortedChannels = useMemo(() => [...channels].sort(), [channels]);

	function handleAdd() {
		setError('');
		if (!onAdd(newHandle)) {
			setError('Could not add channel. Check the handle and avoid duplicates.');
			return;
		}
		setNewHandle('');
	}

	function startEditing(handle: string) {
		setEditingHandle(handle);
		setEditingValue(handle);
		setError('');
	}

	function saveEditing() {
		if (!editingHandle) return;
		setError('');
		if (!onUpdate(editingHandle, editingValue)) {
			setError('Could not save changes. Check the handle and avoid duplicates.');
			return;
		}
		setEditingHandle(null);
		setEditingValue('');
	}

	return (
		<section className='soft-reveal rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90'>
			<div className='mb-4 flex items-start justify-between gap-3'>
				<div>
					<h2 className='text-base font-semibold text-zinc-900 dark:text-zinc-100'>Manage channels</h2>
					<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
						{isCollapsed
							? `${channels.length} saved channel${channels.length === 1 ? '' : 's'}`
							: 'Add the channels you want in your feed.'}
					</p>
				</div>
				<button
					type='button'
					onClick={onToggleCollapse}
					className='rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
				>
					{isCollapsed ? 'Expand' : 'Collapse'}
				</button>
			</div>

			{isCollapsed ? null : (
				<>

				<div className='mb-4 flex flex-col gap-2 sm:flex-row'>
					<input
						type='text'
						value={newHandle}
						onChange={(e) => setNewHandle(normalizeHandleForDisplay(e.target.value))}
						placeholder='@channelhandle'
						disabled={disabled}
						className='w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-red-400 focus:ring-3 focus:ring-red-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
					/>
					<button
						type='button'
						onClick={handleAdd}
						disabled={disabled || !newHandle.trim()}
						className='rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50'
					>
						Add
					</button>
				</div>

				{error && (
					<div className='mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400'>
						{error}
					</div>
				)}

				{sortedChannels.length === 0 ? (
					<p className='rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-400'>
						No channels added yet.
					</p>
				) : (
					<ul className='space-y-2'>
						{sortedChannels.map((handle) => {
							const isEditing = editingHandle === handle;
							return (
								<li
									key={handle}
									className='flex flex-col gap-2 rounded-xl border border-zinc-200/90 bg-zinc-50/50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/50 sm:flex-row sm:items-center'
								>
									{isEditing ? (
										<>
											<input
												type='text'
												value={editingValue}
												onChange={(e) =>
													setEditingValue(normalizeHandleForDisplay(e.target.value))
												}
												disabled={disabled}
												className='w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none transition focus:border-red-400 focus:ring-3 focus:ring-red-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'
											/>
											<div className='flex gap-2'>
												<button
													type='button'
													onClick={saveEditing}
													disabled={disabled || !editingValue.trim()}
													className='rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300'
												>
													Save
												</button>
												<button
													type='button'
													onClick={() => setEditingHandle(null)}
													disabled={disabled}
													className='rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
												>
													Cancel
												</button>
											</div>
										</>
									) : (
										<>
											<span className='w-full text-sm font-medium text-zinc-800 dark:text-zinc-100'>
												{handle}
											</span>
											<div className='flex gap-2'>
												<button
													type='button'
													onClick={() => startEditing(handle)}
													disabled={disabled}
													className='rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
												>
													Edit
												</button>
												<button
													type='button'
													onClick={() => onRemove(handle)}
													disabled={disabled}
													className='rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50'
												>
													Remove
												</button>
											</div>
										</>
									)}
								</li>
							);
						})}
					</ul>
				)}
				</>
			)}
		</section>
	);
}
