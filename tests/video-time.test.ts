import { describe, expect, it } from 'vitest';
import { publishedAtSortWeight } from '../app/lib/video-time';

describe('publishedAtSortWeight', () => {
	it('orders relative times correctly', () => {
		const oneHour = publishedAtSortWeight('1 hour ago');
		const twoDays = publishedAtSortWeight('2 days ago');
		expect(oneHour).toBeLessThan(twoDays);
	});

	it('puts unknown strings last', () => {
		expect(publishedAtSortWeight('sometime maybe')).toBe(Number.MAX_SAFE_INTEGER);
	});
});
