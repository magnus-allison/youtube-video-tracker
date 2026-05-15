import { describe, expect, it } from 'vitest';
import {
	extractChannelTitle,
	extractContinuationItems,
	extractInitialDataBlob,
	extractInnertubeConfig,
	extractVideos,
	extractVideosTabContents
} from '../app/lib/youtube-parser';

describe('youtube parser helpers', () => {
	it('extracts innertube config from html', () => {
		const html = '"INNERTUBE_API_KEY":"abc123" ... "INNERTUBE_CLIENT_VERSION":"1.20260101"';
		expect(extractInnertubeConfig(html)).toEqual({
			apiKey: 'abc123',
			clientVersion: '1.20260101'
		});
	});

	it('extracts initial data blob and videos tab contents', () => {
		const initialData = {
			metadata: { channelMetadataRenderer: { title: 'MKBHD' } },
			contents: {
				twoColumnBrowseResultsRenderer: {
					tabs: [
						{
							tabRenderer: {
								title: 'Videos',
								content: {
									richGridRenderer: {
										contents: [
											{
												richItemRenderer: {
													content: {
														videoRenderer: {
															videoId: 'vid1',
															title: { runs: [{ text: 'Video 1' }] },
															descriptionSnippet: { runs: [{ text: 'Desc' }] },
															publishedTimeText: { simpleText: '2 days ago' }
														}
													}
												}
											},
											{
												continuationItemRenderer: {
													continuationEndpoint: {
														continuationCommand: { token: 'next-token' }
													}
												}
											}
										]
									}
								}
							}
						}
					]
				}
			}
		};

		const html = `... var ytInitialData = ${JSON.stringify(initialData)};`;
		const blob = extractInitialDataBlob(html);
		expect(blob).not.toBeNull();
		expect(extractChannelTitle(blob, '@fallback')).toBe('MKBHD');

		const contents = extractVideosTabContents(blob);
		const { videos, continuation } = extractVideos(contents);
		expect(videos).toHaveLength(1);
		expect(videos[0]).toMatchObject({ id: 'vid1', title: 'Video 1', description: 'Desc' });
		expect(continuation).toBe('next-token');
	});

	it('extracts continuation items from continuation payload', () => {
		const payload = {
			onResponseReceivedActions: [
				{
					appendContinuationItemsAction: {
						continuationItems: [{ richItemRenderer: { content: { videoRenderer: { videoId: 'x' } } } }]
					}
				}
			]
		};

		expect(extractContinuationItems(payload)).toHaveLength(1);
	});
});
