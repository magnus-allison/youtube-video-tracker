export function normalizeHandleForDisplay(handle: string): string {
	const trimmed = handle.trim();
	if (!trimmed) return '';
	const withoutAt = trimmed.replace(/^@+/, '');
	return withoutAt ? `@${withoutAt}` : '';
}

export function normalizeHandleForUrl(handle: string): string {
	return normalizeHandleForDisplay(handle).replace(/^@/, '');
}

export function normalizeHandleForStorage(handle: string): string {
	return normalizeHandleForDisplay(handle).toLowerCase();
}

export function normalizeHandleInput(raw: string): string {
	if (!raw) return '';
	return raw.startsWith('@') ? raw : `@${raw}`;
}

export function dedupeNormalizedHandles(handles: string[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];

	for (const handle of handles) {
		const normalized = normalizeHandleForStorage(handle);
		if (!normalized || seen.has(normalized)) continue;
		seen.add(normalized);
		result.push(normalized);
	}

	return result;
}
