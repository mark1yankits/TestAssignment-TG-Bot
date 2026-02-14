require('dotenv').config();

const required = ['TELEGRAM_BOT_TOKEN', 'ALLOWED_CHAT_ID', 'MONGO_URI'];
const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length > 0) {
  console.error('Missing required env:', missing.join(', '));
  process.exit(1);
}

const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN.trim(),
    allowedChatId: String(process.env.ALLOWED_CHAT_ID).trim(),
  },
  mongo: {
    uri: process.env.MONGO_URI.trim(),
  },
  server: {
    port: Number(process.env.PORT) || 3000,
  },
  admin: {
    password: process.env.ADMIN_PASSWORD?.trim() || '',
  },
  cloudflare: {
    token: (process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY || '').trim(),
    accountId: (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim(),
  },
};

module.exports = config;
