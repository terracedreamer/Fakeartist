# Changelog — Fake Artist

---

## 2026-03-28 — MBS Platform SSO Migration (Session 3)

### Added
- `server/middleware/requireAuth.js` — JWT validation middleware (HS256, extracts userId/email/name/avatar/isAdmin)
- `server/services/entitlementService.js` — Entitlement check with 5-min in-memory cache per userId
- `server/routes/entitlement.js` — `GET /api/entitlement` protected route
- `client/src/stores/authStore.js` — Zustand auth store for MBS Platform SSO
- `platform-instructions/` — MBS Platform migration guide
- `PHASE_5_REPORT_fakeartist.md` — Migration completion report

### Changed
- `server/server.js` — Wired entitlement route (`/api` prefix)
- `server/config/env.js` — MONGO_URL/MONGODB_URI/MONGO_URI fallbacks, JWT_SECRET required
- `server/package.json` — Added `jsonwebtoken` ^9.0.3
- `client/src/App.jsx` — Token redirect on mount, legacy `/login` `/signup` → platform redirect
- `client/src/pages/Landing.jsx` — Sign In / Logout button in top-right header
- `client/src/pages/Home.jsx` — Pre-fill username from MBS Platform profile
- `client/src/hooks/useSocket.js` — Kicked → `/play` (was `/`)
- `.env.example` — Added JWT_SECRET, PLATFORM_URL, PRODUCT_SLUG

### Notes
- No files deleted — product had zero existing auth or billing code
- Socket connections remain unauthenticated by design (party game UX)
- Coolify env vars and CORS_ORIGINS update still pending (user action required)

---

## 2026-03-21 — OpenAI Switch + Premium UI Overhaul (Session 2)

### Changed
- **Switched AI provider from Anthropic (Claude) to OpenAI (GPT-4o-mini)**
- `server/services/aiService.js` — Rewrote to use OpenAI SDK with `response_format: { type: 'json_object' }`
- `server/package.json` — Replaced `@anthropic-ai/sdk` with `openai`
- `server/config/env.js` — `ANTHROPIC_API_KEY` → `OPENAI_API_KEY`
- `.env.example` — Updated API key placeholder
- `CLAUDE.md` — Updated all AI references
- `DEPLOYMENT.md` — Updated env vars, troubleshooting, architecture diagram

### Added — Premium UI
- **Landing page** (`Landing.jsx`) — Aurora gradient hero with Unsplash bg, "How to Play" (4 scroll-triggered step cards), Features grid, footer CTA
- **7 shared components**: PageTransition, GlassCard, AnimatedButton, CountdownRing, AnimatedCounter, ConfirmModal
- **CSS utilities**: glass-card (backdrop-blur), gradient-text, glow, shimmer, aurora-bg, pulse-glow, landing-hero bg, custom scrollbar, selection colors
- **RGB theme vars** (`--canvas-card-rgb`, `--canvas-accent-rgb`) for all 4 themes
- **Page transitions** via AnimatePresence in App.jsx
- **Route restructure**: `/` → Landing, `/play` → Home (create/join)

### Added — Gameplay Enhancements
- **Redemption countdown** — 10-second CountdownRing with auto-submit on timeout
- **Vote confirmation** — ConfirmModal prevents accidental taps
- **Animated score deltas** — AnimatedCounter shows +/- badges on score changes
- **Visual discussion timer** — CountdownRing replaces plain text timer

### Enhanced — All Pages
- **Home**: GlassCard form, animated avatar selection, gradient text, AnimatePresence mode transitions
- **Lobby**: Staggered player list entries, pulsing "waiting" text, glow QR code, animated settings expand/collapse, AnimatedCounter player count
- **Game**: Phase transition animations (fade/scale), staggered game-over leaderboard, spring animation on 1st place
- **HostCanvas**: Turn pop animation, layoutId sliding turn indicator, animated phase overlays, staggered leaderboard

---

## 2026-03-20 — Initial Build (Session 1)

### Commits
1. `e6f3a2d` — `feat: initial project scaffolding with full game implementation`
2. `e243d5b` — `docs: add Coolify deployment guide`
3. `a2a8f68` — `docs: add session handoff, changelog, status, and future work`

### Added
- **Project scaffolding**: Folder structure, package.json for server and client, .gitignore, .env.example
- **Backend (11 source files)**: Express server with Socket.io, MongoDB (Mongoose), Winston logger, Helmet, CORS, rate limiting, health/metrics endpoints, room model with TTL, full game service, AI service with fallback dictionary, socket handlers
- **Frontend (17 source files)**: React + Vite + Tailwind CSS + Zustand state management, 4 pages (Home, Lobby, Game, HostCanvas), 2 components (DrawingCanvas, HostCanvasDisplay), socket client + hook
- **Game features**: Room create/join via code + QR, 8 avatar presets, configurable settings, real-time drawing sync, discussion phase with countdown, simultaneous voting, Fake Artist redemption, scoring with penalties
- **4 visual themes**: Dark & Artsy, Bright & Playful, Clean & Minimal, Retro Sketchbook
- **Dockerfiles**: Backend + Frontend multi-stage builds
- **DEPLOYMENT.md**: Full Coolify deployment guide
