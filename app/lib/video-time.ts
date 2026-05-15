const scaleByUnit: Record<string, number> = {
	minute: 60,
	hour: 3600,
	day: 86400,
	week: 604800,
	month: 2592000,
	year: 31536000
};

export function publishedAtSortWeight(raw: string): number {
	const value = raw.trim().toLowerCase();
	if (!value) return Number.MAX_SAFE_INTEGER;

	const date = Date.parse(value);
	if (!Number.isNaN(date)) {
		return Math.max(Date.now() - date, 0) / 1000;
	}

	const match = value.match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/);
	if (!match) return Number.MAX_SAFE_INTEGER;

	const count = Number(match[1]);
	const unit = match[2];
	return count * (scaleByUnit[unit] ?? Number.MAX_SAFE_INTEGER);
}
