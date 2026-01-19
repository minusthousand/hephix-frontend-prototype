# Hephix Frontend Prototype

Minimal full-screen chat UI built with React + Vite, wired to a local backend.

## Features
- Full-screen chat interface with typing indicator and error bubble
- Dark mode via `prefers-color-scheme`
- Backend integration via `POST /chat`
- Preserves multiline responses

## Getting Started
Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

## Backend
Set the backend base URL via `VITE_CHAT_API_URL` (defaults to the dev proxy base).
The backend should expose a `POST /chat` endpoint that accepts:

```json
{ "message": "hello" }
```

and responds with:

```json
{ "message": "..." }
```

During development, Vite proxies `/chat` to the backend to avoid CORS preflight.
You can set the API base URL in an `.env` file for production or when not using
the dev proxy:

```bash
VITE_CHAT_API_URL=https://your-api.example.com
```
