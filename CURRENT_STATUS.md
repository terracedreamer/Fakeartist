# Current Status — Fake Artist

> Last updated: 2026-03-20

---

## System Health

| Component | Status | Notes |
|-----------|--------|-------|
| Backend | Built, not deployed | Ready for Coolify |
| Frontend | Built, not deployed | Ready for Coolify |
| MongoDB | Not configured | Needs connection string in `.env` |
| Claude API | Not configured | Needs API key in `.env`; game works without it (fallback words) |
| Socket.io | Implemented | Needs end-to-end testing |

---

## Git

- **Repo**: https://github.com/terracedreamer/Fakeartist
- **Branch**: `main`
- **Last commit**: `docs: add Coolify deployment guide`
- **Total commits**: 2

---

## Known Issues

1. **Not tested end-to-end yet** — App was built in one session, needs local testing with MongoDB running
2. **No reconnection handling** — If a player's socket disconnects mid-game, they're removed from the room. No rejoin mechanism yet.
3. **No photo upload** — Player identity system supports avatar presets only. Photo upload mentioned in spec but not implemented.
4. **No input sanitization on drawing data** — Stroke points are accepted as-is from clients. Should validate point coordinates are within canvas bounds.
5. **No speed bonus scoring** — Spec mentions speed bonus for fastest drawer, not implemented yet.
6. **Host canvas shares same socket** — HostCanvas page uses the same Zustand store, which works when opened in a new tab from the same browser session. Opening from a different browser would need its own socket connection to the room.

---

## Environment Variables Needed

### Backend (.env)
```
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
DB_NAME=fakeartist
ANTHROPIC_API_KEY=sk-ant-...
CLIENT_URL=http://localhost:5173
```

### Frontend (Vite)
```
VITE_BACKEND_URL=http://localhost:3001
```

---

## File Inventory (35 files)

### Server (14 files)
- `server/server.js` — Entry point
- `server/config/db.js` — MongoDB connection
- `server/config/env.js` — Env validation
- `server/models/Room.js` — Room/Player/Round/Stroke schemas
- `server/services/gameService.js` — Game logic
- `server/services/aiService.js` — Claude API service
- `server/sockets/gameSocket.js` — Socket.io handlers
- `server/routes/health.js` — Health endpoints
- `server/utils/logger.js` — Winston logger
- `server/package.json` + `server/package-lock.json`
- `server/Dockerfile`

### Client (20 files)
- `client/src/main.jsx` — React entry
- `client/src/App.jsx` — Router + theme
- `client/src/stores/gameStore.js` — Zustand store
- `client/src/services/socket.js` — Socket.io client
- `client/src/hooks/useSocket.js` — Socket event hook
- `client/src/pages/Home.jsx` — Join/create
- `client/src/pages/Lobby.jsx` — Room lobby
- `client/src/pages/Game.jsx` — Player game view
- `client/src/pages/HostCanvas.jsx` — Shared display
- `client/src/components/DrawingCanvas.jsx` — Drawing input
- `client/src/components/HostCanvasDisplay.jsx` — Display canvas
- `client/src/styles/index.css` — Tailwind + themes
- `client/index.html`, `client/vite.config.js`, `client/tailwind.config.js`, `client/postcss.config.js`
- `client/package.json` + `client/package-lock.json`
- `client/Dockerfile`, `client/nginx.conf`

### Root
- `.env.example`, `.gitignore`, `CLAUDE.md`, `DEPLOYMENT.md`
