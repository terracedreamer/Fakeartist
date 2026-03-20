# Changelog — Fake Artist

---

## 2026-03-20 — Initial Build

### Added
- **Project scaffolding**: Folder structure, package.json files for server and client, .gitignore, .env.example
- **Backend**: Express server with Socket.io, MongoDB (Mongoose), Winston logger, Helmet, CORS, rate limiting, health/metrics endpoints
- **Room model**: Mongoose schema with players, rounds, strokes, votes, settings, TTL auto-cleanup
- **Game service**: Full game logic — room create/join, round start, stroke tracking, voting, redemption, scoring
- **AI service**: Claude API integration for dynamic word/category generation and post-round art-critic analysis, with fallback word dictionary
- **Socket handlers**: All real-time events — room management, drawing sync, turn advancement, voting, redemption, host controls (kick, transfer, pause, settings)
- **Frontend**: React + Vite + Tailwind CSS with Zustand state management
- **Home page**: Create/join room flow with username input and avatar selection (8 presets)
- **Lobby page**: Room code display, QR code generation, player list with host controls, game settings panel (rounds, drawing turns, discussion timer, theme, AI analysis toggle)
- **Game page**: Full player view with phases — waiting, drawing, discussion (with countdown timer), voting, redemption, results, game over with leaderboard
- **Host canvas page**: Shared display canvas for TV/projector showing all strokes in real-time, turn indicators, vote results overlay
- **Drawing canvas component**: Touch + mouse input, freehand drawing, 3 brush sizes, 10 colors, eraser tool, undo
- **Host canvas display component**: Read-only canvas that renders all synced strokes
- **4 visual themes**: Dark & Artsy, Bright & Playful, Clean & Minimal, Retro Sketchbook (CSS custom properties)
- **Scoring system**: Points for correct votes, penalty for wrong votes, Fake Artist survival bonus, redemption bonus
- **Dockerfiles**: Backend (Node.js Alpine), Frontend (multi-stage Vite build → Nginx Alpine)
- **Nginx config**: SPA catch-all with gzip and asset caching
- **Deployment guide**: Full Coolify deployment instructions with env var reference, WebSocket config, verification checklist, troubleshooting, architecture diagram
- **Git repo**: Initialized and pushed to https://github.com/terracedreamer/Fakeartist
