export interface ParsedVideo {
	id: string;
	title: string;
	description: string;
	thumbnail: string;
	publishedAt: string;
}

interface InnertubeConfig {
	apiKey: string;
	clientVersion: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function getString(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

export function textFromRuns(runs?: Array<{ text?: string }>): string {
	if (!Array.isArray(runs)) return '';
	return runs.map((r) => r?.text ?? '').join('');
}

export function lockupPublishedAt(lockup: Record<string, unknown>): string {
	const metadata = lockup.metadata;
	if (!isRecord(metadata)) return '';

	const lockupMetadataViewModel = metadata.lockupMetadataViewModel;
	if (!isRecord(lockupMetadataViewModel)) return '';

	const lockupMetadata = lockupMetadataViewModel.metadata;
	if (!isRecord(lockupMetadata)) return '';

	const contentMetadataViewModel = lockupMetadata.contentMetadataViewModel;
	if (!isRecord(contentMetadataViewModel)) return '';

	const rows = asArray(contentMetadataViewModel.metadataRows);

	for (const row of rows) {
		if (!isRecord(row)) continue;
		const parts = asArray(row.metadataParts);
		for (const part of parts) {
			if (!isRecord(part)) continue;
			const text = part.text;
			if (!isRecord(text)) continue;
			const value = getString(text.content);
			if (!value) continue;
			if (/\b(ago|minute|hour|day|week|month|year)s?\b/i.test(value)) {
				return value;
			}
		}
	}

	return '';
}

export function extractInnertubeConfig(html: string): InnertubeConfig | null {
	const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1] ?? null;
	const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1] ?? null;

	if (!apiKey || !clientVersion) return null;
	return { apiKey, clientVersion };
}

export function extractVideos(contents: unknown[]): { videos: ParsedVideo[]; continuation: string | null } {
	const videos: ParsedVideo[] = [];
	let continuation: string | null = null;

	for (const item of contents) {
		if (!isRecord(item)) continue;

		const richItemRenderer = item.richItemRenderer;
		if (isRecord(richItemRenderer)) {
			const content = richItemRenderer.content;
			if (isRecord(content)) {
				const videoRenderer = content.videoRenderer;
				if (isRecord(videoRenderer)) {
					const videoId = getString(videoRenderer.videoId);
					if (videoId) {
						const title = isRecord(videoRenderer.title)
							? getString(
									asArray(videoRenderer.title.runs)[0] &&
										(asArray(videoRenderer.title.runs)[0] as { text?: unknown }).text
								)
							: '';

						let description = '';
						if (isRecord(videoRenderer.descriptionSnippet)) {
							description = textFromRuns(
								asArray(videoRenderer.descriptionSnippet.runs).map((run) => {
									if (!isRecord(run)) return {};
									return { text: getString(run.text) };
								})
							);
						}

						let publishedAt = '';
						if (isRecord(videoRenderer.publishedTimeText)) {
							publishedAt = getString(videoRenderer.publishedTimeText.simpleText);
						}

						videos.push({
							id: videoId,
							title,
							description,
							thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
							publishedAt
						});
					}
				}

				const lockup = content.lockupViewModel;
				if (isRecord(lockup)) {
					const contentType = getString(lockup.contentType);
					const contentId = getString(lockup.contentId);
					if (contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' && contentId) {
						let thumbnail = `https://i.ytimg.com/vi/${contentId}/mqdefault.jpg`;
						const contentImage = lockup.contentImage;
						if (isRecord(contentImage)) {
							const thumbnailViewModel = contentImage.thumbnailViewModel;
							if (isRecord(thumbnailViewModel)) {
								const image = thumbnailViewModel.image;
								if (isRecord(image)) {
									const sources = asArray(image.sources);
									const last = sources[sources.length - 1];
									if (isRecord(last)) {
										thumbnail = getString(last.url) || thumbnail;
									}
								}
							}
						}

						let title = '';
						const metadata = lockup.metadata;
						if (isRecord(metadata)) {
							const model = metadata.lockupMetadataViewModel;
							if (isRecord(model) && isRecord(model.title)) {
								title = getString(model.title.content);
							}
						}

						videos.push({
							id: contentId,
							title,
							description: '',
							thumbnail,
							publishedAt: lockupPublishedAt(lockup)
						});
					}
				}
			}
		}

		const continuationItemRenderer = item.continuationItemRenderer;
		if (isRecord(continuationItemRenderer)) {
			const continuationEndpoint = continuationItemRenderer.continuationEndpoint;
			if (isRecord(continuationEndpoint)) {
				const continuationCommand = continuationEndpoint.continuationCommand;
				if (isRecord(continuationCommand)) {
					continuation = getString(continuationCommand.token) || null;
				}
			}
		}
	}

	return { videos, continuation };
}

export function extractInitialDataBlob(html: string): unknown | null {
	const marker = 'var ytInitialData = ';
	const markerIdx = html.indexOf(marker);
	if (markerIdx === -1) return null;

	const jsonStart = html.indexOf('{', markerIdx);
	if (jsonStart === -1) return null;

	let depth = 0;
	let jsonEnd = jsonStart;
	for (let i = jsonStart; i < html.length; i++) {
		if (html[i] === '{') depth++;
		else if (html[i] === '}') {
			depth--;
			if (depth === 0) {
				jsonEnd = i;
				break;
			}
		}
	}

	if (depth !== 0) return null;

	try {
		return JSON.parse(html.slice(jsonStart, jsonEnd + 1));
	} catch {
		return null;
	}
}

export function extractChannelTitle(data: unknown, fallbackHandle: string): string {
	if (!isRecord(data)) return fallbackHandle;

	const metadata = data.metadata;
	if (isRecord(metadata)) {
		const channelMetadataRenderer = metadata.channelMetadataRenderer;
		if (isRecord(channelMetadataRenderer)) {
			const title = getString(channelMetadataRenderer.title);
			if (title) return title;
		}
	}

	const microformat = data.microformat;
	if (isRecord(microformat)) {
		const microformatDataRenderer = microformat.microformatDataRenderer;
		if (isRecord(microformatDataRenderer)) {
			const title = getString(microformatDataRenderer.title);
			if (title) return title;
		}
	}

	return fallbackHandle;
}

export function extractVideosTabContents(data: unknown): unknown[] {
	if (!isRecord(data)) return [];

	const contents = data.contents;
	if (!isRecord(contents)) return [];

	const twoColumnBrowseResultsRenderer = contents.twoColumnBrowseResultsRenderer;
	if (!isRecord(twoColumnBrowseResultsRenderer)) return [];

	const tabs = asArray(twoColumnBrowseResultsRenderer.tabs);
	const videosTab = tabs.find((tab) => {
		if (!isRecord(tab)) return false;
		const tabRenderer = tab.tabRenderer;
		if (!isRecord(tabRenderer)) return false;
		return getString(tabRenderer.title) === 'Videos' || tabRenderer.selected === true;
	});

	if (!isRecord(videosTab)) return [];
	const tabRenderer = videosTab.tabRenderer;
	if (!isRecord(tabRenderer)) return [];
	const tabContent = tabRenderer.content;
	if (!isRecord(tabContent)) return [];
	const richGridRenderer = tabContent.richGridRenderer;
	if (!isRecord(richGridRenderer)) return [];

	return asArray(richGridRenderer.contents);
}

export function extractContinuationItems(contData: unknown): unknown[] {
	if (!isRecord(contData)) return [];
	const actions = asArray(contData.onResponseReceivedActions);

	for (const action of actions) {
		if (!isRecord(action)) continue;
		const append = action.appendContinuationItemsAction;
		if (!isRecord(append)) continue;
		const items = asArray(append.continuationItems);
		if (items.length > 0) return items;
	}

	return [];
}
