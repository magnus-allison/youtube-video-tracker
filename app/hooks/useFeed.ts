'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Video } from '../components/VideoGrid';
import type { FeedVideo } from '../components/FeedGrid';
import {
	getFeedChannels,
	getKnownFeedVideos,
	setFeedChannels,
	setKnownFeedVideos,
	type KnownFeedVideos
} from '../lib/storage';
import { dedupeNormalizedHandles, normalizeHandleForStorage } from '../lib/handles';
import { publishedAtSortWeight } from '../lib/video-time';

function sortFeedVideos(videos: FeedVideo[]): FeedVideo[] {
	return [...videos].sort(
		(a, b) => publishedAtSortWeight(a.publishedAt) - publishedAtSortWeight(b.publishedAt)
	);
}

export function useFeed() {
	const [feedChannels, setFeedChannelsState] = useState<string[]>([]);
	const [feedVideos, setFeedVideos] = useState<FeedVideo[]>([]);
	const [isFeedLoading, setIsFeedLoading] = useState(false);
	const [feedError, setFeedError] = useState('');
	const [feedUpdatedAt, setFeedUpdatedAt] = useState<number | null>(null);
	const [isChannelManagerCollapsed, setIsChannelManagerCollapsed] = useState(false);

	useEffect(() => {
		const normalizedChannels = dedupeNormalizedHandles(getFeedChannels());
		setFeedChannelsState(normalizedChannels);
		setFeedChannels(normalizedChannels);
	}, []);

	const addFeedChannel = useCallback(
		(handle: string): boolean => {
			const normalized = normalizeHandleForStorage(handle);
			if (!normalized) return false;
			if (feedChannels.includes(normalized)) return false;

			const updated = [...feedChannels, normalized];
			setFeedChannelsState(updated);
			setFeedChannels(updated);
			return true;
		},
		[feedChannels]
	);

	const updateFeedChannel = useCallback(
		(previousHandle: string, nextHandle: string): boolean => {
			const prev = normalizeHandleForStorage(previousHandle);
			const next = normalizeHandleForStorage(nextHandle);
			if (!prev || !next) return false;

			if (!feedChannels.includes(prev)) return false;
			if (prev !== next && feedChannels.includes(next)) return false;

			const updated = feedChannels.map((channel) => (channel === prev ? next : channel));
			setFeedChannelsState(updated);
			setFeedChannels(updated);

			if (prev !== next) {
				const known = getKnownFeedVideos();
				if (known[prev]) {
					known[next] = known[prev];
					delete known[prev];
					setKnownFeedVideos(known);
				}
			}

			setFeedVideos((current) =>
				current.map((video) =>
					video.channelHandle === prev ? { ...video, channelHandle: next } : video
				)
			);

			return true;
		},
		[feedChannels]
	);

	const removeFeedChannel = useCallback(
		(handle: string): void => {
			const normalized = normalizeHandleForStorage(handle);
			if (!normalized) return;

			const updated = feedChannels.filter((channel) => channel !== normalized);
			setFeedChannelsState(updated);
			setFeedChannels(updated);
			setFeedVideos((current) => current.filter((video) => video.channelHandle !== normalized));

			const known = getKnownFeedVideos();
			if (known[normalized]) {
				delete known[normalized];
				setKnownFeedVideos(known);
			}
		},
		[feedChannels]
	);

	const refreshFeed = useCallback(async () => {
		if (feedChannels.length === 0 || isFeedLoading) return;

		setIsFeedLoading(true);
		setFeedError('');

		try {
			const knownVideos = getKnownFeedVideos();
			const nextKnownVideos: KnownFeedVideos = { ...knownVideos };

			const responses = await Promise.all(
				feedChannels.map(async (channel) => {
					const response = await fetch(`/api/youtube?handle=${encodeURIComponent(channel)}`);
					const payload = (await response.json()) as {
						channelTitle?: string;
						videos?: Video[];
						error?: string;
					};
					return {
						channel,
						ok: response.ok,
						payload
					};
				})
			);

			const mergedVideos: FeedVideo[] = [];
			const failedChannels: string[] = [];

			for (const result of responses) {
				if (!result.ok || !Array.isArray(result.payload.videos)) {
					failedChannels.push(result.channel);
					continue;
				}

				const seenIds = new Set(nextKnownVideos[result.channel] ?? []);
				const latestIdsForChannel: string[] = [];

				for (const video of result.payload.videos) {
					const isNew = !seenIds.has(video.id);
					mergedVideos.push({
						id: video.id,
						title: video.title,
						thumbnail: video.thumbnail,
						publishedAt: video.publishedAt,
						channelHandle: result.channel,
						channelTitle: result.payload.channelTitle || result.channel,
						isNew
					});
					latestIdsForChannel.push(video.id);
				}

				nextKnownVideos[result.channel] = Array.from(
					new Set([...latestIdsForChannel, ...(nextKnownVideos[result.channel] ?? [])])
				).slice(0, 300);
			}

			setKnownFeedVideos(nextKnownVideos);
			setFeedVideos(sortFeedVideos(mergedVideos));
			setFeedUpdatedAt(Date.now());

			if (failedChannels.length > 0) {
				setFeedError(`Could not load ${failedChannels.join(', ')}.`);
			}
		} catch {
			setFeedError('Failed to refresh feed. Please try again.');
		} finally {
			setIsFeedLoading(false);
		}
	}, [feedChannels, isFeedLoading]);

	return {
		feedChannels,
		feedVideos,
		isFeedLoading,
		feedError,
		feedUpdatedAt,
		isChannelManagerCollapsed,
		setIsChannelManagerCollapsed,
		addFeedChannel,
		updateFeedChannel,
		removeFeedChannel,
		refreshFeed
	};
}
