import { NextRequest, NextResponse } from 'next/server';
import { normalizeHandleForDisplay } from '../../lib/handles';
import {
	extractChannelTitle,
	extractContinuationItems,
	extractInnertubeConfig,
	extractInitialDataBlob,
	extractVideos,
	extractVideosTabContents,
	type ParsedVideo
} from '../../lib/youtube-parser';

const YOUTUBE_PAGE_HEADERS = {
	'User-Agent':
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
	Accept: 'text/html',
	'Accept-Language': 'en-US,en;q=0.9'
};

const REQUEST_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 2 * 60 * 1000;

const channelCache = new Map<
	string,
	{
		expiresAt: number;
		payload: { channelTitle: string; videos: ParsedVideo[]; continuation: string | null };
	}
>();

async function fetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		return await fetch(input, {
			...init,
			signal: controller.signal
		});
	} finally {
		clearTimeout(timeout);
	}
}

function getCachedChannel(handleKey: string) {
	const cached = channelCache.get(handleKey);
	if (!cached) return null;
	if (cached.expiresAt < Date.now()) {
		channelCache.delete(handleKey);
		return null;
	}
	return cached.payload;
}

function setCachedChannel(
	handleKey: string,
	payload: { channelTitle: string; videos: ParsedVideo[]; continuation: string | null }
) {
	channelCache.set(handleKey, {
		expiresAt: Date.now() + CACHE_TTL_MS,
		payload
	});
}

export async function GET(request: NextRequest) {
	const handle = request.nextUrl.searchParams.get('handle');
	const continuationToken = request.nextUrl.searchParams.get('continuation');

	if (!handle) {
		return NextResponse.json({ error: 'Missing handle parameter' }, { status: 400 });
	}

	const withAt = normalizeHandleForDisplay(handle);
	const cacheKey = withAt.toLowerCase();

	if (!continuationToken) {
		const cached = getCachedChannel(cacheKey);
		if (cached) {
			return NextResponse.json(cached);
		}
	}

	try {
		const pageRes = await fetchWithTimeout(`https://www.youtube.com/${withAt}/videos`, {
			headers: YOUTUBE_PAGE_HEADERS,
			redirect: 'follow'
		});

		if (!pageRes.ok) {
			return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
		}

		const html = await pageRes.text();

		// --- Continuation request: fetch next page via YouTube internal API ---
		if (continuationToken) {
			const innertubeConfig = extractInnertubeConfig(html);
			if (!innertubeConfig) {
				return NextResponse.json({ error: 'Could not parse YouTube client config' }, { status: 500 });
			}

			const body = JSON.stringify({
				context: {
					client: {
						clientName: 'WEB',
						clientVersion: innertubeConfig.clientVersion
					}
				},
				continuation: continuationToken
			});

			const contRes = await fetchWithTimeout(
				`https://www.youtube.com/youtubei/v1/browse?key=${innertubeConfig.apiKey}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body
				}
			);

			if (!contRes.ok) {
				return NextResponse.json({ error: 'Failed to load more videos' }, { status: 500 });
			}

			const contData = (await contRes.json()) as unknown;
			const items = extractContinuationItems(contData);
			if (items.length > 0) {
				const { videos, continuation } = extractVideos(items);
				return NextResponse.json({ videos, continuation });
			}

			return NextResponse.json({ videos: [], continuation: null });
		}

		const data = extractInitialDataBlob(html);
		if (!data) {
			return NextResponse.json({ error: 'Could not parse channel data' }, { status: 404 });
		}

		const channelTitle = extractChannelTitle(data, withAt);
		const contents = extractVideosTabContents(data);

		const { videos, continuation } = extractVideos(contents);

		if (videos.length === 0) {
			return NextResponse.json({ error: 'No videos found' }, { status: 404 });
		}

		const payload = { channelTitle, videos, continuation };
		setCachedChannel(cacheKey, payload);
		return NextResponse.json(payload);
	} catch (err) {
		if (err instanceof Error && err.name === 'AbortError') {
			return NextResponse.json({ error: 'YouTube request timed out' }, { status: 504 });
		}
		console.error('YouTube fetch error:', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
