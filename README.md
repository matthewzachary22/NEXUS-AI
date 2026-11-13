# NEXUS AI

NEXUS is an extensible AI creation workspace for planning games, software, websites, defensive cybersecurity learning labs, and ICT/teaching projects from natural-language prompts.

## Included in this starter

- Responsive NEXUS dashboard
- Game Studio, Code Studio, Web Studio, Cyber Lab, and Learn / ICT workspaces
- Prompt-to-project planning interface
- Server-side OpenAI-compatible AI adapter
- Health endpoint that distinguishes server availability from AI configuration
- Browser-saved draft workspaces
- Render deployment blueprint

This is an initial foundation, not a claim that every planned capability is complete. Full code generation, file editing, execution sandboxes, 3D/game engines, collaboration, and deployment workflows are future build stages.

## Run locally

Requirements: Node.js 20+ and npm.

1. Install: `npm install`
2. Copy `.env.example` to `.env`.
3. Add your AI provider key to `NEXUS_AI_API_KEY` in the server environment.
4. Run: `npm run dev`
5. Open the local URL shown by Vite (usually http://localhost:5173).

## Environment variables

- `NEXUS_AI_API_KEY` — secret API key; server-side only
- `NEXUS_AI_BASE_URL` — optional OpenAI-compatible API base URL (defaults to `https://api.openai.com/v1`)
- `NEXUS_AI_MODEL` — optional model name
- `PORT` — optional server port (defaults to `8787`)

API:
- `GET /api/health`
- `POST /api/ai/plan` with `{ "prompt": "your idea", "mode": "game" }`

If no API key is configured, the planning endpoint returns HTTP 503 with a clear setup message. It does not pretend AI is connected.

## Deploy on Render

Create a Web Service connected to this repository:
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Add `NEXUS_AI_API_KEY` as a secret environment variable in the Render dashboard.

The included `render.yaml` contains a basic blueprint. Never commit a real API key.

## Safety

Cyber Lab is for defensive, authorized cybersecurity education and safe lab planning only.

## Status

Early foundation — under construction.