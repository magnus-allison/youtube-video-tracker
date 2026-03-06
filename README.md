# YouTube Video Tracker

Track which YouTube videos you've watched — designed for when you have YouTube search/watch history turned off.

Search any channel by handle, browse their uploads, and mark videos as watched. Everything is stored locally in your browser (compressed with pako), so nothing is sent to a server.

## Features

- Search YouTube channels by handle (e.g. `@mkbhd`)
- Browse a channel's uploaded videos
- Mark videos as watched/unwatched with one click
- Recent searches saved as quick-access pills
- All data stored in localStorage (compressed, no account needed)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- Next.js 16 / React 19
- Tailwind CSS 4
- pako (localStorage compression)
