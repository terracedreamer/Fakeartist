# Fake Artist — Project CLAUDE.md

> Game design blueprint + development conventions

**Tags:** 3–16 Players · Web App · React + Node.js + Socket.io · AI Powered

---

## Project-Specific Overrides

- **AI/LLM**: OpenAI API (`gpt-4o-mini`) — NOT Anthropic/Claude API. Uses `openai` npm package with `response_format: { type: 'json_object' }` for structured output.
- **Hosting**: Coolify (self-hosted VPS) — NOT Vercel/Railway. Two separate Dockerfile services (backend + frontend).
- **Coolify Dockerfile paths**: Base Directory = `/server` or `/client`, Dockerfile Location = `Dockerfile` (relative to base dir, NOT `/server/Dockerfile`).
- **Frontend build args**: `VITE_BACKEND_URL` must be a Coolify **build argument**, not runtime env var.

---

## Routes

| Path | Page | Purpose |
|------|------|---------|
| `/` | Landing | Marketing page — aurora hero, features, CTA |
| `/play` | Home | Create/join room with username + avatar |
| `/lobby/:code` | Lobby | Room settings, player list, QR code |
| `/game/:code` | Game | Player drawing, voting, redemption |
| `/host/:code` | HostCanvas | Shared TV/projector display |

When navigating "back to home" from any page, use `/play` (not `/`).
QR join URLs use `/play?join=CODE`.

---

## UI Architecture

### Theme System
4 themes via CSS custom properties on `[data-theme]` attribute (set in App.jsx from room settings, defaults to `clean-minimal`):
- `clean-minimal` — White bg (#fff), indigo accent (#6366f1)
- `dark-artsy` — Dark bg (#0f0f0f), purple accent (#a78bfa)
- `bright-playful` — Yellow bg (#fef9c3), pink accent (#f472b6)
- `retro-sketchbook` — Beige bg (#faf0e6), tan accent (#d4a373)

Each theme has `--canvas-card-rgb` and `--canvas-accent-rgb` for glass effects with variable opacity.

### Shared Components
| Component | File | Purpose |
|-----------|------|---------|
| PageTransition | `components/PageTransition.jsx` | Wrap page return in this for enter/exit animations |
| GlassCard | `components/GlassCard.jsx` | Backdrop-blur card. Use instead of plain `bg-canvas-card` divs |
| AnimatedButton | `components/AnimatedButton.jsx` | Spring hover/tap. Variants: primary, secondary, danger, small, small-danger |
| CountdownRing | `components/CountdownRing.jsx` | SVG circular timer. Props: seconds, remaining, size |
| AnimatedCounter | `components/AnimatedCounter.jsx` | Animated number with +/- delta badges |
| ConfirmModal | `components/ConfirmModal.jsx` | Glass-morphism confirmation dialog |

### CSS Utilities (index.css)
- `.glass-card` — backdrop-blur card
- `.gradient-text` — accent-to-pink gradient text
- `.glow` — accent color box-shadow
- `.shimmer` — animated gradient highlight
- `.pulse-glow` — pulsing box-shadow
- `.aurora-bg` — animated gradient background
- `.landing-hero` — Unsplash bg image via ::before at 0.05 opacity

### Animation Conventions
- Page transitions: `AnimatePresence mode="wait"` in App.jsx wrapping Routes
- Each page wraps return in `<PageTransition>`
- List items: stagger with `delay: index * 0.08`
- Phase changes in Game/HostCanvas: `AnimatePresence mode="wait"` with keyed motion.divs
- Buttons: use `AnimatedButton` component (not raw `<button>`)
- Cards: use `GlassCard` component

---

## Core Specs

| Spec | Detail |
|---|---|
| Players | 3–16 per room |
| Platform | Web browser (mobile + desktop) |
| Session length | Variable — host sets number of rounds |
| Visual style | Player/host selectable per game |

---

## Room Joining System

### Room Code
- 6-character alphanumeric code displayed on the host screen
- Players type it into any browser to join instantly

### QR Code
- QR code auto-generated for the room
- Point phone camera to join — no typing needed
- Perfect for in-person same-room play

---

## How the Canvas Works

The host screen acts as the **shared display canvas** — visible to everyone in the room on a TV, laptop, or shared screen. Each player draws their stroke privately on their own phone, which then appears on the host canvas in real time.

- Host screen = shared canvas everyone watches
- Player phones = individual drawing input devices
- Strokes sync live via Socket.io to the host display

---

## Drawing Tools

| Tool | Description |
|---|---|
| Freehand drawing | Draw freely with finger or stylus |
| Brush size options | Small (2px), medium (4px), large (8px) |
| Color selection | 10-color palette (black, red, orange, yellow, green, blue, purple, pink, white, gray) |
| Undo last stroke | Remove your most recent stroke if needed |
| Eraser tool | Erase specific parts of your stroke (3x brush size) |

---

## Turn Structure

- Each player draws **one continuous line per turn**
- Once the player lifts their finger (or releases the mouse), the turn ends
- The canvas locks for that player until the next round of turns
- Turn order rotates through all players until the host-defined number of rounds is complete

---

## Word System

### How Words Are Chosen
A mix of AI-generated and custom words each round:
- **AI-generated** — OpenAI generates a word from a random category each round
- **Custom** — Host can type their own word before the round starts
- The word is shown secretly to all players **except the Fake Artist**
- **Fallback** — If OpenAI API is unavailable, words come from built-in dictionary (animals, food, landmarks, objects, nature)

---

## Round Structure

1. Host sets the number of drawing rounds before the game starts
2. Secret word is assigned — all players see it except the Fake Artist
3. Players take turns drawing one continuous stroke on the canvas
4. After all drawing rounds are complete, discussion begins
5. Players discuss, then vote simultaneously

---

## Voting Phase

### Discussion First
After drawing rounds end, all players can discuss openly. Discussion has a configurable countdown timer displayed as a visual CountdownRing.

### Simultaneous Vote
After discussion, all players vote at the same time for who they think the Fake Artist is. **A confirmation modal prevents accidental votes.** The player with the most votes is revealed.

---

## The Fake Artist Redemption

If the Fake Artist is caught (receives the most votes):
- They are **not immediately eliminated**
- A **10-second visual countdown ring** appears
- They must **guess the secret word** before the timer expires
- **Auto-submits** if timer reaches zero
- If they guess correctly — **Fake Artist still wins**
- If they guess wrong — **Artists win**

---

## Player Identity

Players can identify themselves using:
- **Username** — chosen at join screen (max 20 characters)
- **Avatar** — selected from 8 presets (artist, detective, wizard, ninja, robot, alien, pirate, astronaut)

**Not yet implemented:** Custom artist character, photo upload.

---

## Scoring System

| Action | Points |
|---|---|
| Correctly identifying the Fake Artist | + points for each voter who got it right |
| Fake Artist surviving undetected | + bonus points for the Fake Artist |
| Fake Artist guessing the word correctly after being caught | + redemption bonus |
| Wrong accusation (voting out an innocent player) | - penalty points |

Score changes are displayed with animated +/- delta indicators.

**Not yet implemented:** Speed bonus for fastest drawer.

---

## Visual Styles

| Style | Theme Key | Vibe |
|---|---|---|
| Dark & artsy | `dark-artsy` | Moody, gallery vibes — dark backgrounds, muted palette |
| Bright & playful | `bright-playful` | Colourful, cartoonish — fun and energetic |
| Clean & minimal | `clean-minimal` | White canvas, studio feel — pure and distraction-free (default) |
| Retro sketchbook | `retro-sketchbook` | Paper texture, hand-drawn feel — warm and nostalgic |

---

## AI-Powered Features (OpenAI API)

### Word Category Generation
OpenAI (GPT-4o-mini) dynamically generates fresh word categories and words every round using `response_format: { type: 'json_object' }`. Falls back to built-in dictionary if API is unavailable.

### Post-Round Analysis
After each round, OpenAI generates a fun art-critic-style breakdown of who drew what — calling out suspicious strokes, praising bold moves, and building tension before the vote. Toggleable in game settings.

---

## Host Controls

### In-Game Controls
- Kick any player from the room
- Pause and resume the game at any time
- Anyone can become host (host-transfer supported)

### Pre-Game Settings
- Set a custom word for the round
- Choose number of drawing rounds per game (1–10)
- Set drawing turns per round (1–5)
- Select visual style / theme
- Set discussion timer length (15–300 seconds)
- Toggle AI post-round analysis on or off

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | Zustand |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Database | MongoDB (Mongoose) — 24hr TTL on rooms |
| AI engine | OpenAI API (gpt-4o-mini) via `openai` npm package |
| Canvas rendering | HTML5 Canvas API |
| QR codes | qrcode.react |
| Hosting | Coolify (self-hosted VPS) — 2 Dockerfile services |

---

## Key Implementation Details

### Socket Events Flow
1. `create-room` / `join-room` → Room.code + playerId returned
2. `start-game` → status='playing'
3. `start-round` → fakeArtistId assigned, word/category sent (real artists only)
4. `draw-stroke` → stroke broadcasted to all, turn incremented
5. `discussion-phase` → AI analysis + timer
6. `submit-vote` → collected until all voted, results broadcast
7. `redemption-guess` (if fake artist caught) → 10-second window with auto-submit
8. `game-over` → final leaderboard

### Database Schema
- **Room**: code (unique), players[], rounds[], settings, currentRound, currentTurnIndex, currentDrawingRound, status, TTL (24hr)
- **Player**: socketId, username, avatar, photoUrl, score, isHost, isConnected
- **Round**: roundNumber, word, wordSource, fakeArtistId, strokes[], votes, caughtPlayerId, redemptionGuess/Correct, aiAnalysis, status
- **Stroke**: playerId, points[], color, brushSize, round, timestamp

### No Auth System
Players are ephemeral (socket-based identity). Rooms auto-expire after 24 hours via MongoDB TTL index.
