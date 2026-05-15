'use client';

import { useCallback, useState } from 'react';
import { getWatchedVideoIds, setWatchedVideoIds } from '../lib/storage';

export function useWatchedVideos() {
	const [watchedIds, setWatchedIds] = useState<Set<string>>(() => new Set(getWatchedVideoIds()));

	const toggleWatched = useCallback((id: string) => {
		setWatchedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			setWatchedVideoIds([...next]);
			return next;
		});
	}, []);

	return { watchedIds, toggleWatched };
}
