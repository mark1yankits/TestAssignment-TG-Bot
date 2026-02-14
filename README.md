# Telegram Bot + Cloudflare API

Telegram bot with Cloudflare DNS management, Express API, and React admin panel.

## Stack

- **Backend:** Node.js, Express, Telegraf, Mongoose, axios
- **Frontend:** React (Vite), MUI
- **DB:** MongoDB (Atlas or local)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm start
```

**Required env (backend):**

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
| `ALLOWED_CHAT_ID` | Telegram chat ID where the bot is allowed (e.g. from getUpdates) |
| `MONGO_URI` | MongoDB connection string |
| `PORT` | Server port (default 3000) |
| `ADMIN_PASSWORD` | Password for admin panel and API (`x-admin-key` header) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (Zone + DNS edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (for adding zones) |

### 2. Frontend (admin panel)

```bash
cd frontend
npm install
# Optional: create .env with VITE_API_URL=http://localhost:3000 if API is on different host
npm run dev
```

Open http://localhost:5173, log in with `ADMIN_PASSWORD`.

## Features

- **Bot:** Works only in one chat (`ALLOWED_CHAT_ID`). Only users from the allowed list (managed in admin panel) can use commands.
- **Commands:** `/start`, `/help`, `/add_domain <domain>`, `/dns_list`, `/dns_add`, `/dns_update`, `/dns_delete`.
- **Express:** `GET/POST /webhook-log` — sends request info (IP, method) to the Telegram chat.
- **Admin panel:** Login by password; manage allowed users; view and delete DNS records per zone.

## Project structure

```
backend/
  config.js           # Env validation and config
  server.js           # Express + Telegraf entry
  middleware/         # Auth (requireAdminKey)
  routes/             # users, zones API
  services/           # Cloudflare API client
  bot/                # Telegram middleware + commands
  models/             # Mongoose (AllowedUser)
frontend/             # React admin (Vite + MUI)
```

## License

MIT
