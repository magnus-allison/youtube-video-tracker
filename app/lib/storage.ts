import pako from 'pako';

function compress(data: unknown): string {
	const json = JSON.stringify(data);
	const compressed = pako.deflate(json);
	return btoa(String.fromCharCode(...compressed));
}

function decompress<T>(raw: string): T {
	try {
		const binary = atob(raw);
		const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
		const json = pako.inflate(bytes, { to: 'string' });
		return JSON.parse(json) as T;
	} catch {
		// Fall back to plain JSON (old/uncompressed format)
		return JSON.parse(raw) as T;
	}
}

export function getStorageItem<T>(key: string, fallback: T): T {
	if (typeof window === 'undefined') return fallback;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return decompress<T>(raw);
	} catch {
		return fallback;
	}
}

export function setStorageItem(key: string, data: unknown): void {
	localStorage.setItem(key, compress(data));
}

const RECENT_KEY = 'yt-tracker-recent';
const MAX_RECENT = 5;
const FEED_CHANNELS_KEY = 'yt-tracker-feed-channels';
const FEED_KNOWN_VIDEOS_KEY = 'yt-tracker-feed-known-videos';
const WATCHED_KEY = 'yt-tracker-watched';

export function getRecentSearches(): string[] {
	return getStorageItem<string[]>(RECENT_KEY, []);
}

export function addRecentSearch(handle: string): string[] {
	const current = getRecentSearches();
	const filtered = current.filter((h) => h.toLowerCase() !== handle.toLowerCase());
	const updated = [handle, ...filtered].slice(0, MAX_RECENT);
	setStorageItem(RECENT_KEY, updated);
	return updated;
}

export function getFeedChannels(): string[] {
	return getStorageItem<string[]>(FEED_CHANNELS_KEY, []);
}

export function setFeedChannels(handles: string[]): void {
	setStorageItem(FEED_CHANNELS_KEY, handles);
}

export type KnownFeedVideos = Record<string, string[]>;

export function getKnownFeedVideos(): KnownFeedVideos {
	return getStorageItem<KnownFeedVideos>(FEED_KNOWN_VIDEOS_KEY, {});
}

export function setKnownFeedVideos(knownVideos: KnownFeedVideos): void {
	setStorageItem(FEED_KNOWN_VIDEOS_KEY, knownVideos);
}

export function getWatchedVideoIds(): string[] {
	return getStorageItem<string[]>(WATCHED_KEY, []);
}

export function setWatchedVideoIds(ids: string[]): void {
	setStorageItem(WATCHED_KEY, ids);
}
