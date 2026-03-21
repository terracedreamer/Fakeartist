# Current Status — Fake Artist

> Last updated: 2026-03-21 (Session 2)

---

## System Health

| Component | Status | Notes |
|-----------|--------|-------|
| Backend | Built, not deployed | 11 source files, ready for Coolify |
| Frontend | Built, not deployed | 24 source files (17 original + 7 new components/pages), build verified |
| MongoDB | Not configured | Needs connection string in `.env` |
| OpenAI API | Not configured | Needs `OPENAI_API_KEY` in `.env`; game works without it (fallback words) |
| Socket.io | Implemented | Needs end-to-end testing with multiple clients |
| Docker | Dockerfiles ready | Backend: Node.js Alpine, Frontend: multi-stage Vite → Nginx Alpine |

---

## Git

- **Repo**: https://github.com/terracedreamer/Fakeartist
- **Branch**: `main`
- **Total commits**: 7
- **Last commit**: `959870d` — `docs: update project CLAUDE.md with session learnings`

---

## Known Issues

1. **Not tested end-to-end yet** — Needs local testing with MongoDB and 3+ browser tabs
2. **No reconnection handling** — Socket disconnect removes player. No rejoin mechanism.
3. **No photo upload** — 8 avatar presets only.
4. **No input sanitization on drawing data** — Stroke points not validated for bounds.
5. **No speed bonus scoring** — Mentioned in spec, not implemented.
6. **Host canvas shares same socket** — Works in new tab from same browser only.
7. **Fixed canvas size** — 400x400 player, 800x600 host. No coordinate normalization.
8. **Discussion timer desync** — Client-side setInterval, should be server-authoritative.
9. **No socket event throttling** — Only HTTP routes are rate-limited.

---

## Routes

| Path | Page | Purpose |
|------|------|---------|
| `/` | Landing | Marketing page with hero, features, CTA |
| `/play` | Home | Create/join room with username + avatar |
| `/lobby/:code` | Lobby | Room settings, player list, QR code |
| `/game/:code` | Game | Player drawing, voting, redemption |
| `/host/:code` | HostCanvas | Shared TV/projector display |

---

## Environment Variables

### Backend (.env)
```
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
DB_NAME=fakeartist
OPENAI_API_KEY=sk-...
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_BACKEND_URL=http://localhost:3001
```

> In Coolify: `VITE_BACKEND_URL` must be a **build argument**, not runtime env var.

---

## Dependencies

### Server
express, socket.io, mongoose, openai, cors, helmet, morgan, express-rate-limit, winston, dotenv, express-validator, uuid

### Client
react, react-dom, react-router-dom, socket.io-client, zustand, axios, framer-motion, lucide-react, qrcode.react, sonner, react-helmet-async
**Dev**: vite, @vitejs/plugin-react, tailwindcss, postcss, autoprefixer

---

## File Inventory (35 source files + 8 root files)

### Server (11 source files)
- `server/server.js` — Express entry point with Socket.io setup
- `server/config/db.js` — MongoDB connection via Mongoose
- `server/config/env.js` — Env validation (OPENAI_API_KEY)
- `server/models/Room.js` — Room/Player/Round/Stroke schemas (24hr TTL)
- `server/services/gameService.js` — All game logic
- `server/services/aiService.js` — OpenAI API service (gpt-4o-mini + fallback)
- `server/sockets/gameSocket.js` — Socket.io event handlers
- `server/routes/health.js` — /health and /metrics
- `server/utils/logger.js` — Winston logger
- `server/package.json`, `server/Dockerfile`

### Client (24 source files)
**Pages (5):**
- `Landing.jsx` — Marketing page with aurora hero, features, CTA
- `Home.jsx` — Create/join with animated avatars, GlassCard
- `Lobby.jsx` — Staggered player list, glow QR, animated settings
- `Game.jsx` — Phase transitions, countdown rings, vote confirm, animated scores
- `HostCanvas.jsx` — Turn animations, staggered leaderboard

**Components (8):**
- `DrawingCanvas.jsx` — Touch/mouse drawing input
- `HostCanvasDisplay.jsx` — Read-only display canvas
- `PageTransition.jsx` — Page enter/exit animation wrapper
- `GlassCard.jsx` — Glass-morphism card
- `AnimatedButton.jsx` — Spring hover/tap button
- `CountdownRing.jsx` — SVG circular countdown timer
- `AnimatedCounter.jsx` — Animated number with deltas
- `ConfirmModal.jsx` — Confirmation modal

**Core:**
- `App.jsx` — Router + AnimatePresence + theme
- `main.jsx` — React entry with providers
- `stores/gameStore.js` — Zustand store
- `services/socket.js` — Socket.io client
- `hooks/useSocket.js` — Socket event hook
- `styles/index.css` — Tailwind + themes + utilities

**Config:**
- `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`
- `package.json`, `Dockerfile`, `nginx.conf`

### Root (8 files)
- `.env.example`, `.gitignore`, `Claude.md`
- `DEPLOYMENT.md`, `SESSION_HANDOFF.md`, `CHANGELOG.md`, `CURRENT_STATUS.md`, `FUTURE_WORK_TODO.md`
