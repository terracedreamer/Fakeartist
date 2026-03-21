# Fake Artist — Coolify Deployment Guide

> Two separate services: **backend** (Node.js + Socket.io) and **frontend** (React → Nginx)

---

## Prerequisites

- Coolify instance running on your VPS
- Domain or subdomain pointed to your VPS (e.g. `fakeartist-api.magicbusstudios.com` + `fakeartist.magicbusstudios.com`)
- MongoDB cluster accessible from the VPS
- OpenAI API key for AI features

---

## Step 1: Create a New Project in Coolify

1. Log into your Coolify dashboard
2. Click **"New Project"** → name it `Fake Artist`
3. Inside the project, you'll add **two separate services**

---

## Step 2: Deploy the Backend

### 2a. Add a New Resource

1. Inside your Fake Artist project, click **"+ New"** → **"Public Repository"**
2. Enter the GitHub repo URL: `https://github.com/terracedreamer/Fakeartist.git`
3. Set **Branch**: `main`
4. Set **Build Pack**: `Dockerfile`
5. Set **Base Directory**: `/server`
6. Set **Dockerfile Location**: `/server/Dockerfile`
7. Set **Port**: `3001`

### 2b. Environment Variables

Go to the **Environment Variables** tab and add:

```
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net
DB_NAME=fakeartist
OPENAI_API_KEY=sk-your-key-here
CLIENT_URL=https://fakeartist.magicbusstudios.com
```

> Replace with your actual MongoDB connection string and OpenAI key.
> `CLIENT_URL` must match your frontend domain exactly (for CORS).

### 2c. Domain & SSL

1. Go to **Settings** → **Domains**
2. Add your backend domain: `fakeartist-api.magicbusstudios.com`
3. Enable **HTTPS** (Coolify handles Let's Encrypt automatically)

### 2d. Advanced Settings

1. Under **Settings** → **General**:
   - Health check path: `/health`
   - Health check interval: `30` seconds
2. Under **Settings** → **Network**:
   - Exposed port: `3001`
   - Make sure WebSocket support is enabled (required for Socket.io)

### 2e. Deploy

Click **"Deploy"** and wait for the build to complete. Verify by visiting:
```
https://fakeartist-api.magicbusstudios.com/health
```

You should see:
```json
{"success":true,"status":"ok","timestamp":"...","mongodb":"connected"}
```

---

## Step 3: Deploy the Frontend

### 3a. Add a New Resource

1. Inside the same Fake Artist project, click **"+ New"** → **"Public Repository"**
2. Same repo URL: `https://github.com/terracedreamer/Fakeartist.git`
3. Set **Branch**: `main`
4. Set **Build Pack**: `Dockerfile`
5. Set **Base Directory**: `/client`
6. Set **Dockerfile Location**: `/client/Dockerfile`
7. Set **Port**: `80`

### 3b. Build Arguments (CRITICAL)

Go to the **Environment Variables** tab. Add this as a **Build Argument** (not a runtime env var):

```
VITE_BACKEND_URL=https://fakeartist-api.magicbusstudios.com
```

> **This MUST be a build argument**, not a runtime variable. Vite bakes `VITE_*` variables into the bundle at build time. In Coolify, toggle the variable type to "Build Variable" / "Build Argument".

### 3c. Domain & SSL

1. Go to **Settings** → **Domains**
2. Add your frontend domain: `fakeartist.magicbusstudios.com`
3. Enable **HTTPS**

### 3d. Deploy

Click **"Deploy"** and wait for the build. Visit:
```
https://fakeartist.magicbusstudios.com
```

You should see the Fake Artist home screen.

---

## Step 4: Verify WebSocket Connectivity

Socket.io requires WebSocket upgrades to work. Coolify's Traefik proxy handles this by default, but verify:

1. Open browser DevTools → **Network** tab
2. Filter by "WS" (WebSocket)
3. Create a room on the frontend — you should see a WebSocket connection to `wss://fakeartist-api.magicbusstudios.com/socket.io/...`
4. If the WebSocket fails and falls back to polling, check Traefik config (see Troubleshooting below)

---

## Step 5: Post-Deployment Verification Checklist

Run through this flow after every deployment:

- [ ] `/health` endpoint returns `"mongodb":"connected"`
- [ ] Home page loads (frontend)
- [ ] Can create a room (backend Socket.io working)
- [ ] QR code displays correctly
- [ ] Second browser/tab can join with room code
- [ ] Drawing strokes sync to host canvas
- [ ] Starting a round assigns word (Claude API working)
- [ ] Voting + redemption flow completes
- [ ] Scores update correctly
- [ ] Theme changes apply

---

## Environment Variables Reference

### Backend (Runtime)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (use `3001`) |
| `NODE_ENV` | Yes | `production` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `DB_NAME` | Yes | Database name (`fakeartist`) |
| `OPENAI_API_KEY` | No | OpenAI API key (AI features disabled without it) |
| `CLIENT_URL` | Yes | Frontend URL for CORS (e.g. `https://fakeartist.magicbusstudios.com`) |

### Frontend (Build Argument)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_BACKEND_URL` | Yes | Backend API URL (e.g. `https://fakeartist-api.magicbusstudios.com`) |

---

## Troubleshooting

### "Network Error" or CORS issues
1. Check `CLIENT_URL` on the backend matches the frontend domain **exactly** (including `https://`, no trailing slash)
2. Redeploy backend after changing env vars

### WebSocket not connecting / falling back to polling
1. In Coolify, go to the backend service → **Settings** → **Network**
2. Ensure the domain is configured with WebSocket support
3. If using a custom Traefik config, add these labels to the backend service:
   ```
   traefik.http.middlewares.fakeartist-headers.headers.customrequestheaders.Connection=Upgrade
   traefik.http.middlewares.fakeartist-headers.headers.customrequestheaders.Upgrade=websocket
   ```
4. Alternatively, Coolify v4+ handles WebSockets automatically via Traefik — make sure you're on the latest version

### Frontend shows blank page
1. Check browser console for errors
2. Most common: `VITE_BACKEND_URL` was set as a runtime variable instead of a **build argument**
3. Fix: change it to a build argument in Coolify and **redeploy** (rebuild required)

### MongoDB connection fails
1. Check `MONGODB_URI` includes the protocol (`mongodb+srv://` or `mongodb://`)
2. Make sure your MongoDB cluster allows connections from your VPS IP (check Atlas Network Access or firewall rules)
3. Check container logs in Coolify for the exact error

### OpenAI API not working (words fall back to defaults)
1. Check `OPENAI_API_KEY` is set correctly in backend env vars
2. Check container logs for "AI word generation failed" messages
3. The game works without the API key — it uses fallback word lists

### Container won't start / build fails
1. Check Coolify build logs for the error
2. Common issue: wrong Base Directory or Dockerfile path
3. Backend: Base Directory = `/server`, Dockerfile = `/server/Dockerfile`
4. Frontend: Base Directory = `/client`, Dockerfile = `/client/Dockerfile`

### OneDrive git issues (local development)
If you get `mmap failed` errors on Windows with OneDrive:
```bash
attrib -U +P .git /S /D
```

---

## Updating the App

1. Push changes to `main` branch on GitHub
2. In Coolify, go to each service and click **"Redeploy"**
   - If only backend changed, redeploy backend only
   - If only frontend changed, redeploy frontend only
   - If env vars changed, redeploy the affected service
3. **If `VITE_*` variables changed**: frontend must be **rebuilt** (not just restarted)

### Auto-Deploy (Optional)

1. In each Coolify service, go to **Settings** → **General**
2. Enable **"Auto Deploy"** — Coolify will watch the GitHub repo and redeploy on push to `main`

---

## Architecture Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│   Frontend (Nginx)  │       │  Backend (Node.js)   │
│                     │       │                      │
│  fakeartist.        │ WSS   │  fakeartist-api.     │
│  magicbusstudios    │──────▶│  magicbusstudios     │
│  .com               │       │  .com:3001           │
│                     │       │                      │
│  React SPA          │       │  Express + Socket.io │
│  Tailwind CSS       │       │  Mongoose            │
│  Socket.io Client   │       │  OpenAI API          │
└─────────────────────┘       └──────────┬───────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │     MongoDB Atlas    │
                              │     DB: fakeartist   │
                              └─────────────────────┘
```

---

*Last updated: 2026-03-20*
