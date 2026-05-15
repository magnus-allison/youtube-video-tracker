import { describe, expect, it } from 'vitest';
import {
	dedupeNormalizedHandles,
	normalizeHandleForDisplay,
	normalizeHandleForStorage,
	normalizeHandleForUrl
} from '../app/lib/handles';

describe('handle normalization', () => {
	it('normalizes display handles with a single @ prefix', () => {
		expect(normalizeHandleForDisplay('mkbhd')).toBe('@mkbhd');
		expect(normalizeHandleForDisplay('@mkbhd')).toBe('@mkbhd');
		expect(normalizeHandleForDisplay('@@@mkbhd')).toBe('@mkbhd');
	});

	it('normalizes url handles without @ prefix', () => {
		expect(normalizeHandleForUrl('mkbhd')).toBe('mkbhd');
		expect(normalizeHandleForUrl('@mkbhd')).toBe('mkbhd');
	});

	it('normalizes storage handles in lowercase', () => {
		expect(normalizeHandleForStorage('@MKBHD')).toBe('@mkbhd');
	});

	it('dedupes mixed channel input to canonical storage handles', () => {
		expect(dedupeNormalizedHandles(['@MKBHD', 'mkbhd', '  @Fireship  ', '@fireship'])).toEqual([
			'@mkbhd',
			'@fireship'
		]);
	});
});
