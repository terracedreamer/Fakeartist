# Phase 5 Report — Fake Artist SSO Migration

> Generated: 2026-03-28
> Product: **Fake Artist**
> Slug: `fakeartist`
> Domain: `fakeartist.magicbusstudios.com`
> Category: `arcade`
> Brand: `mbs`

---

## 1. What Was Built/Changed

### New Files Created (4)
| File | Purpose |
|------|---------|
| `server/middleware/requireAuth.js` | JWT validation middleware — verifies MBS Platform tokens (HS256), extracts userId/email/name/avatar/isAdmin |
| `server/services/entitlementService.js` | Entitlement check against MBS Platform API with 5-minute in-memory cache per userId |
| `server/routes/entitlement.js` | `GET /api/entitlement` — protected route for frontend to check user's access level |
| `client/src/stores/authStore.js` | Zustand auth store — token handling, login redirect, logout, `?token=` extraction |

### Modified Files (7)
| File | Changes |
|------|---------|
| `server/server.js` | Added entitlement route import and wiring (`/api` prefix) |
| `server/config/env.js` | Added MONGO_URL/MONGO_URI fallbacks, JWT_SECRET to required vars, PLATFORM_URL/PRODUCT_SLUG to optional vars |
| `server/package.json` | Added `jsonwebtoken` ^9.0.2 dependency |
| `client/src/App.jsx` | Added token redirect handling on mount, legacy `/login` and `/signup` route redirects to MBS Platform, imported authStore |
| `client/src/pages/Landing.jsx` | Added Sign In / Logout button in fixed header (top-right), imported authStore |
| `client/src/pages/Home.jsx` | Pre-fills username from MBS Platform profile if authenticated, imported authStore |
| `client/src/hooks/useSocket.js` | Fixed kicked handler to navigate to `/play` instead of `/` |
| `.env.example` | Added JWT_SECRET, PLATFORM_URL, PRODUCT_SLUG vars |

### Deleted Files
None — this product had **zero existing auth or billing** (socket-based ephemeral identity only).

---

## 2. What Changed From the Plan

| Deviation | Reason |
|-----------|--------|
| No files deleted | Product had no standalone auth system — no login/signup pages, no auth routes, no Passport, no Google OAuth, no Stripe. Migration was purely additive. |
| Username/avatar kept in Home.jsx | The game uses ephemeral player identity (username + avatar per room). SSO pre-fills the username from platform profile but still allows the user to change it. This preserves the "drop in and play" experience while adding persistent identity via JWT. |
| No requireAuth on game socket events | Socket.io connections remain unauthenticated — the game is designed for quick drop-in play (scan QR, type code, play). JWT auth is used for the entitlement check API only. Adding socket auth would break the core UX of "no account needed to play." |
| Graceful degradation on entitlement check | If MBS Platform is unreachable, entitlement defaults to allowing access. This prevents the game from being unplayable if the platform has downtime. |

---

## 3. Env Vars Required

### Backend (.env)
| Variable | Required | Value |
|----------|----------|-------|
| `PORT` | Optional | `3001` (default) |
| `NODE_ENV` | Optional | `production` |
| `MONGODB_URI` | Required | MongoDB connection string (also supports `MONGO_URL` or `MONGO_URI`) |
| `DB_NAME` | Required | `fakeartist` |
| `OPENAI_API_KEY` | Optional | OpenAI API key (game works without it via fallback words) |
| `CLIENT_URL` | Optional | Frontend URL for CORS (e.g., `https://fakeartist.magicbusstudios.com`) |
| `JWT_SECRET` | **Required** | Must match MBS Platform's JWT_SECRET exactly |
| `PLATFORM_URL` | Optional | `https://api.magicbusstudios.com` (default) |
| `PRODUCT_SLUG` | Optional | `fakeartist` (default) |

### Frontend (build arg)
| Variable | Required | Value |
|----------|----------|-------|
| `VITE_BACKEND_URL` | Required (build arg) | `https://api-fakeartist.magicbusstudios.com` or wherever backend is deployed |

---

## 4. Code Removed

None. This product had no standalone auth or billing code to remove.

---

## 5. JWT Integration

| Detail | Value |
|--------|-------|
| Library | `jsonwebtoken` ^9.0.2 (Node.js) |
| Header format | `Authorization: Bearer <JWT>` |
| Algorithm | `HS256` |
| Secret source | `process.env.JWT_SECRET` (shared with MBS Platform) |
| Fields extracted | `userId` (string), `email`, `name`, `avatar`, `isAdmin` |
| Middleware file | `server/middleware/requireAuth.js` |
| Applied to | `GET /api/entitlement` route only (game socket events remain unauthenticated) |

### Frontend Token Flow
1. User clicks "Sign In" → redirects to `https://magicbusstudios.com/auth/login?redirect=https://fakeartist.magicbusstudios.com&brand=mbs`
2. After platform login, redirected back with `?token=<JWT>` in URL
3. `App.jsx` calls `authStore.handleTokenRedirect()` on mount
4. Token stored as `localStorage.setItem('mbs_token', token)`
5. User decoded from JWT payload and stored as `localStorage.setItem('mbs_user', JSON.stringify(user))`
6. `window.history.replaceState()` removes `?token=` from URL
7. Logout clears both localStorage keys

---

## 6. Entitlement Check

| Detail | Value |
|--------|-------|
| Endpoint | `GET https://api.magicbusstudios.com/api/entitlements/fakeartist` |
| Auth | `Authorization: Bearer <JWT>` |
| Cache | In-memory Map, 5-minute TTL per userId |
| Proxy route | `GET /api/entitlement` (backend proxies to platform) |
| Failure mode | Graceful — allows access if platform is unreachable |
| Response fields | `{ success, hasAccess, reason }` |
| Reason values | `free_tier`, `product_pass`, `category_access`, `mbs_all_access`, `no_subscription`, `entitlement_check_failed`, `entitlement_check_error` |

---

## 7. Assumptions Made

1. **Socket connections remain unauthenticated** — Fake Artist is a party game where players join via room code or QR. Requiring login to play would break the UX. JWT auth is only for the entitlement check.
2. **Username is still user-entered per game** — Even authenticated users can change their display name per room (it's a party game). MBS Platform name is used as a pre-fill only.
3. **No premium features gated yet** — The entitlement infrastructure is wired but no game features currently require premium access. When premium features are added (custom themes, AI analysis, etc.), the entitlement check can be used to gate them.
4. **PLATFORM_URL defaults to api.magicbusstudios.com** — Per Phase 3B learnings, API calls go to the backend domain, not the frontend domain.
5. **No GDPR user-data endpoint yet** — This product stores rooms (24hr TTL) with ephemeral player data keyed by socketId, not userId. No persistent user data means no GDPR gap currently. If user-specific data is added later, a `DELETE /api/user-data` endpoint will be needed.

---

## 8. Known Gaps

1. **No premium feature gating yet** — Entitlement check is wired but no features use it. The `reason` field (`free_tier` vs `product_pass`) is available for future premium features.
2. **Socket events are unauthenticated** — By design for this party game. If abuse becomes an issue, socket auth can be added by passing JWT in socket handshake.
3. **No GDPR delete endpoint** — Not needed currently (no persistent user data), but will need one if user-specific data is added in the future.
4. **No logout API call** — Client-side only (clears localStorage). Optional `POST /api/auth/logout` to MBS Platform is not implemented.

---

## 9. Testing Steps

### Local Development
1. Add to `.env`: `JWT_SECRET=<same-as-mbs-platform>`, `PLATFORM_URL=https://api.magicbusstudios.com`, `PRODUCT_SLUG=fakeartist`
2. `cd server && npm install && npm run dev`
3. `cd client && npm install && npm run dev`
4. Visit `http://localhost:5173` — Landing page should show "Sign In" button
5. Click "Sign In" — should redirect to `https://magicbusstudios.com/auth/login?redirect=https://fakeartist.magicbusstudios.com&brand=mbs`
6. After login, verify token is in localStorage (`mbs_token`, `mbs_user`)
7. Visit `/play` — username should be pre-filled from platform profile
8. Test creating/joining rooms works (socket events unchanged)
9. Test `GET http://localhost:3001/api/entitlement` with `Authorization: Bearer <token>` header
10. Visit `/login` or `/signup` — should redirect to MBS Platform login

### Coolify Deployment
1. Add `JWT_SECRET` env var to backend service (must match MBS Platform exactly)
2. Add `PLATFORM_URL=https://api.magicbusstudios.com` to backend service
3. Add `PRODUCT_SLUG=fakeartist` to backend service
4. Verify `VITE_BACKEND_URL` build arg is set on frontend service
5. Redeploy both services
6. Test login flow end-to-end through the platform

---

## Coolify Action Items

### Env Vars to ADD (Backend Service)
| Variable | Example Value | Notes |
|----------|---------------|-------|
| `JWT_SECRET` | `<copy from MBS Platform backend>` | **MUST match exactly** — shared secret |
| `PLATFORM_URL` | `https://api.magicbusstudios.com` | API backend, NOT frontend URL |
| `PRODUCT_SLUG` | `fakeartist` | Used for entitlement checks |

### Env Vars to REMOVE
None — this product had no auth/billing env vars to remove.

### Build Args to ADD or REMOVE
None — `VITE_BACKEND_URL` already exists as a build arg on the frontend service.

### MBS Platform CORS_ORIGINS
**YES** — `https://fakeartist.magicbusstudios.com` must be added to the MBS Platform's `CORS_ORIGINS` list. Without this, the `?redirect=` URL in the login flow will be rejected and users will be sent to `magicbusstudios.com` instead of back to Fake Artist.

### DNS / Coolify Service Config
No changes needed — existing services and domains remain the same.
