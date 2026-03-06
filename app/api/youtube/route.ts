import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractVideos(contents: any[]) {
	const videos = [];
	let continuation: string | null = null;

	for (const item of contents) {
		const vr = item.richItemRenderer?.content?.videoRenderer;
		if (vr?.videoId) {
			videos.push({
				id: vr.videoId,
				title: vr.title?.runs?.[0]?.text ?? '',
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				description: vr.descriptionSnippet?.runs?.map((r: any) => r.text).join('') ?? '',
				thumbnail: `https://i.ytimg.com/vi/${vr.videoId}/mqdefault.jpg`,
				publishedAt: vr.publishedTimeText?.simpleText ?? ''
			});
		}
		if (item.continuationItemRenderer) {
			continuation =
				item.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token ?? null;
		}
	}

	return { videos, continuation };
}

export async function GET(request: NextRequest) {
	const handle = request.nextUrl.searchParams.get('handle');
	const continuationToken = request.nextUrl.searchParams.get('continuation');

	if (!handle) {
		return NextResponse.json({ error: 'Missing handle parameter' }, { status: 400 });
	}

	try {
		// --- Continuation request: fetch next page via YouTube internal API ---
		if (continuationToken) {
			const body = JSON.stringify({
				context: {
					client: {
						clientName: 'WEB',
						clientVersion: '2.20260303.00.00'
					}
				},
				continuation: continuationToken
			});

			const contRes = await fetch(
				'https://www.youtube.com/youtubei/v1/browse?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body
				}
			);

			if (!contRes.ok) {
				return NextResponse.json({ error: 'Failed to load more videos' }, { status: 500 });
			}

			const contData = await contRes.json();
			const actions = contData.onResponseReceivedActions ?? [];

			for (const action of actions) {
				const items = action.appendContinuationItemsAction?.continuationItems ?? [];
				if (items.length > 0) {
					const { videos, continuation } = extractVideos(items);
					return NextResponse.json({ videos, continuation });
				}
			}

			return NextResponse.json({ videos: [], continuation: null });
		}

		// --- Initial request: scrape the channel page ---
		const withAt = handle.startsWith('@') ? handle : `@${handle}`;

		const pageRes = await fetch(`https://www.youtube.com/${withAt}/videos`, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Accept: 'text/html',
				'Accept-Language': 'en-US,en;q=0.9'
			},
			redirect: 'follow'
		});

		if (!pageRes.ok) {
			return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
		}

		const html = await pageRes.text();

		// Extract ytInitialData JSON blob from the page
		const dataMatch = html.match(/var ytInitialData\s*=\s*({[\s\S]*?});\s*<\/script>/);
		if (!dataMatch) {
			return NextResponse.json({ error: 'Could not parse channel data' }, { status: 404 });
		}

		const data = JSON.parse(dataMatch[1]);

		// Extract channel title from metadata
		const channelTitle =
			data.metadata?.channelMetadataRenderer?.title ??
			data.microformat?.microformatDataRenderer?.title ??
			withAt;

		// Find the Videos tab content
		const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const videosTab = tabs.find((t: any) => t.tabRenderer?.title === 'Videos' || t.tabRenderer?.selected);
		const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents ?? [];

		const { videos, continuation } = extractVideos(contents);

		if (videos.length === 0) {
			return NextResponse.json({ error: 'No videos found' }, { status: 404 });
		}

		return NextResponse.json({ channelTitle, videos, continuation });
	} catch (err) {
		console.error('YouTube fetch error:', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
