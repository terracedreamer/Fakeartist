# Session Handoff — Fake Artist

> Last updated: 2026-03-28 (Session 3)

---

## What Was Done

### Session 1 (2026-03-20) — Full Build
Full app built from scratch following the CLAUDE.md game design blueprint. Backend (11 source files), Frontend (17 source files), Docker configs, deployment guide.

### Session 2 (2026-03-21) — OpenAI Switch + Premium UI Overhaul
- Switched AI from Anthropic to OpenAI (gpt-4o-mini)
- Premium UI: Landing page, 7 shared components, 4 themes with RGB vars, page transitions
- Gameplay: Redemption countdown ring, vote confirmation modal, animated score deltas, visual discussion timer

### Session 3 (2026-03-28) — MBS Platform SSO Migration

**New Files (4):**
- `server/middleware/requireAuth.js` — JWT validation middleware (HS256, shared JWT_SECRET with MBS Platform)
- `server/services/entitlementService.js` — Entitlement check against `api.magicbusstudios.com` with 5-min in-memory cache per userId
- `server/routes/entitlement.js` — `GET /api/entitlement` protected route
- `client/src/stores/authStore.js` — Zustand auth store (token handling, login redirect, logout, `?token=` extraction from URL)

**Modified Files (7):**
- `server/server.js` — Wired entitlement route
- `server/config/env.js` — Added MONGO_URL/MONGODB_URI/MONGO_URI fallbacks, JWT_SECRET required, PLATFORM_URL/PRODUCT_SLUG optional
- `server/package.json` — Added `jsonwebtoken` ^9.0.3
- `client/src/App.jsx` — Token redirect handling on mount, legacy `/login` `/signup` → platform redirect
- `client/src/pages/Landing.jsx` — Sign In / Logout button in fixed top-right header
- `client/src/pages/Home.jsx` — Pre-fills username from MBS Platform profile
- `client/src/hooks/useSocket.js` — Kicked handler navigates to `/play` not `/`
- `.env.example` — Added JWT_SECRET, PLATFORM_URL, PRODUCT_SLUG

**Key Decision:** Socket connections remain unauthenticated — this is a party game (QR scan → play). JWT auth is only for the entitlement API.

### Git History
- 9 commits on `main` branch
- Last commit: `8935c96` — `feat: MBS Platform SSO migration`
- Pushed to: https://github.com/terracedreamer/Fakeartist

---

## What's Next (URGENT — Must Do Before SSO Works)

### Coolify Action Items (User Must Do Manually)
1. **Add env vars to Fake Artist BACKEND service in Coolify:**
   - `JWT_SECRET` = (copy exact value from MBS Platform backend service)
   - `PLATFORM_URL` = `https://api.magicbusstudios.com`
   - `PRODUCT_SLUG` = `fakeartist`
2. **Add to MBS Platform backend CORS_ORIGINS:**
   - Add `https://fakeartist.magicbusstudios.com` to the MBS Platform backend's `CORS_ORIGINS` env var (this is on the `api.magicbusstudios.com` Coolify service, NOT the Fake Artist service)
3. **Redeploy both Coolify services** (backend + frontend) — code was pushed to `main`
4. **Verify SSO flow** — Visit fakeartist.magicbusstudios.com, click Sign In, complete login on platform, verify redirect back with token

### After SSO Verified
5. **Test locally end-to-end** — Full game flow with 3+ browser tabs
6. **Input sanitization** — Validate stroke coordinates, sanitize usernames
7. **Socket reconnection** — Store playerId in localStorage, allow mid-game rejoin

---

## Critical Context

- **Auth**: MBS Platform SSO via JWT. Login redirects to `magicbusstudios.com/auth/login`. Token stored in localStorage as `mbs_token`. Socket connections are NOT authenticated (party game UX).
- **Entitlement**: `GET /api/entitlement` checks `api.magicbusstudios.com/api/entitlements/fakeartist`. Cached 5 min per userId. Graceful degradation (allows access if platform is down).
- **AI provider**: OpenAI API via `openai` SDK — uses `gpt-4o-mini` model.
- **Socket.io architecture**: Players draw on phones → strokes emit to server → server broadcasts to all clients including host canvas display
- **Turn mechanic**: One continuous line per turn. Stroke completes on finger lift / mouse up. Canvas locks until next turn.
- **Fake Artist redemption**: If caught (most votes), gets 10 seconds to guess the word. Auto-submits on timeout. Correct guess = Fake Artist wins.
- **Themes**: 4 themes via CSS custom properties on `[data-theme]` attribute (clean-minimal default). RGB variants for glass effects.
- **Routes**: `/` = Landing, `/play` = Create/Join, `/lobby/:code`, `/game/:code`, `/host/:code`, `/login` `/signup` → platform redirect
- **Product**: Slug `fakeartist`, Category `arcade`, Domain `fakeartist.magicbusstudios.com`
