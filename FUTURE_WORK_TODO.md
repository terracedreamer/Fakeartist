# Future Work — Fake Artist

> Organized by priority · Last updated: 2026-03-21

---

## High Priority (Before First Deploy)

- [ ] **Local end-to-end test** — Run server + client locally, test full game flow with 3+ browser tabs
- [ ] **Deploy to Coolify** — Follow DEPLOYMENT.md, verify WebSocket connectivity
- [ ] **Input sanitization** — Validate stroke point coordinates are within canvas bounds, sanitize usernames
- [ ] **Socket reconnection** — Handle player disconnect/reconnect mid-game (store playerId in localStorage, allow rejoin)

---

## Medium Priority (Post-Launch Polish)

- [ ] **Responsive canvas scaling** — Drawing canvas is fixed 400x400; should scale based on device size with coordinate normalization between player and host canvas
- [ ] **Server-authoritative discussion timer** — Current client-side setInterval can drift; server should broadcast timer state
- [ ] **Socket event throttling** — Add per-socket rate limiting on draw-stroke and other high-frequency events
- [ ] **Photo upload** — Allow players to upload a profile photo (store as base64 or upload to a CDN)
- [ ] **Speed bonus scoring** — Track time to complete stroke, award bonus points to fastest drawer
- [ ] **Host canvas independence** — Allow host canvas to be opened from any device (join as spectator via room code)
- [ ] **Mobile canvas optimization** — Prevent scrolling while drawing, optimize touch responsiveness across devices
- [ ] **Sound effects** — Turn notification, timer warning, vote reveal, round start/end sounds
- [ ] **Error boundaries** — React error boundaries around each page to prevent full-app crashes

---

## Low Priority (Future Features)

- [ ] **Custom artist characters** — Beyond preset avatars, let players create a simple character (color picker + accessories)
- [ ] **Difficulty settings** — Easy/medium/hard word difficulty passed to OpenAI API
- [ ] **Spectator mode** — Non-playing viewers who can watch the host canvas and chat
- [ ] **Game history** — Store completed games in MongoDB, show recent games on home page
- [ ] **Rematch** — "Play Again" button that resets scores but keeps the same room and players
- [ ] **Chat during discussion** — Text chat for remote play (not just in-person discussion)
- [ ] **Accessibility** — Screen reader support, high contrast mode, keyboard navigation
- [ ] **PWA** — Make installable on mobile with offline splash screen
- [ ] **SEO** — Structured data (JSON-LD), per-page meta tags, sitemap

---

## Technical Debt

- [ ] **ESLint + Prettier** — Add linting config to both server and client
- [ ] **Tests** — Unit tests for gameService, integration tests for socket events
- [ ] **TypeScript migration** — Consider TypeScript for better type safety (low priority, app is small)
