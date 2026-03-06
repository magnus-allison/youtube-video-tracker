# YouTube Video Tracker

Track which YouTube videos you've watched — designed for when you have YouTube search/watch history turned off.

Search any channel by handle, browse their uploads, and mark videos as watched. Everything is stored locally in your browser (compressed with pako), so nothing is sent to a server.

<img width="1160" height="840" alt="Screenshot 2026-03-06 at 12 33 58" src="https://github.com/user-attachments/assets/e019adb4-fca0-46a5-93ac-170a3fe6e0df" />

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
