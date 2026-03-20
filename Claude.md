# Fake Artist — Game Design Blueprint

> Complete game design blueprint · Ready to build

**Tags:** 3–16 Players · Web App · React + Node.js + Socket.io · AI Powered

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

Every player has access to the following tools during their turn:

| Tool | Description |
|---|---|
| Freehand drawing | Draw freely with finger or stylus |
| Brush size options | Small, medium, and large brush sizes |
| Color selection | Full color palette to choose from |
| Undo last stroke | Remove your most recent stroke if needed |
| Eraser tool | Erase specific parts of your stroke |

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
- **AI-generated** — Claude generates a word from a random category each round
- **Custom** — Host can type their own word before the round starts
- The word is shown secretly to all players **except the Fake Artist**

### Word Categories (AI-generated)
Claude dynamically generates categories and words each game — no two rounds are the same. Example categories include animals, food, landmarks, emotions, inventions, and more.

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
After drawing rounds end, all players can discuss openly — pointing out suspicious strokes, defending their own contributions, and accusing others.

### Simultaneous Vote
After discussion, all players vote at the same time for who they think the Fake Artist is. The player with the most votes is revealed.

---

## The Fake Artist Redemption

If the Fake Artist is caught (receives the most votes):
- They are **not immediately eliminated**
- They get **10 seconds** to think silently
- After 10 seconds they must **guess the secret word**
- If they guess correctly — **Fake Artist still wins**
- If they guess wrong — **Artists win**

This keeps the tension alive right until the very last second.

---

## Player Identity

Players can identify themselves using any combination of:
- **Username** — chosen at join screen
- **Avatar** — selected from a preset library
- **Custom artist character** — personalised scientist/artist persona
- **Photo upload** — upload your own profile photo

All identity elements are displayed on player cards, voting screens, and the leaderboard.

---

## Scoring System

| Action | Points |
|---|---|
| Correctly identifying the Fake Artist | + points for each voter who got it right |
| Fake Artist surviving undetected | + bonus points for the Fake Artist |
| Fake Artist guessing the word correctly after being caught | + redemption bonus |
| Finishing your drawing stroke fastest | + speed bonus |
| Wrong accusation (voting out an innocent player) | - penalty points |

---

## Visual Styles

The host can select a visual theme before each game. Available styles:

| Style | Vibe |
|---|---|
| Dark & artsy | Moody, gallery vibes — dark backgrounds, muted palette |
| Bright & playful | Colourful, cartoonish — fun and energetic |
| Clean & minimal | White canvas, studio feel — pure and distraction-free |
| Retro sketchbook | Paper texture, hand-drawn feel — warm and nostalgic |

---

## AI-Powered Features (Claude API)

### Word Category Generation
Claude dynamically generates fresh word categories and words every round — ensuring no two games feel the same. Categories scale in difficulty based on host settings.

### Post-Round Analysis
After each round, Claude generates a fun art-critic-style breakdown of who drew what — calling out suspicious strokes, praising bold moves, and building tension before the vote.

*Example: "Player 3's contribution was... bold. Almost too bold for someone who knew what they were drawing. Meanwhile Player 1's timid little squiggle in the corner raises questions."*

---

## Host Controls

### In-Game Controls
- Kick any player from the room
- Pause and resume the game at any time
- Anyone can become host (host-transfer supported)

### Pre-Game Settings
- Set a custom word for the round
- Choose number of drawing rounds per game
- Select visual style / theme
- Set discussion timer length
- Toggle AI post-round analysis on or off

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| AI engine | Claude API (Anthropic) |
| Canvas rendering | HTML5 Canvas API |
| QR codes | qrcode.react library |
| Frontend hosting | Vercel |
| Backend hosting | Railway |

---

## Suggested Build Order

| Week | Focus |
|---|---|
| Week 1 | Set up React + Node.js + Socket.io, build room creation with code and QR joining |
| Week 2 | Build the shared canvas system — strokes drawn on phones appear on host screen in real time |
| Week 3 | Add drawing tools (brush size, color, undo, eraser), turn order, and continuous line mechanic |
| Week 4 | Build word system, voting phase, discussion timer, and Fake Artist redemption mechanic |
| Week 5 | Plug in Claude API for word generation and post-round analysis |
| Week 6 | Add scoring, leaderboards, player identity system, visual themes, and host controls |

---

*Blueprint generated with Claude · Ready to build*
