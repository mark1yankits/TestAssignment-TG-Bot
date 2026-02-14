require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

const AllowedUser = require('./models/AllowedUser');
const usersRouter = require('./routes/users');

const {
  TELEGRAM_BOT_TOKEN,
  ALLOWED_CHAT_ID,
  MONGO_URI,
  PORT,
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_API_KEY,
  CLOUDFLARE_ACCOUNT_ID,
} = process.env;

if (!TELEGRAM_BOT_TOKEN || !ALLOWED_CHAT_ID || !MONGO_URI) {
  console.error('Missing required env: TELEGRAM_BOT_TOKEN, ALLOWED_CHAT_ID, MONGO_URI');
  process.exit(1);
}

const allowedChatId = String(ALLOWED_CHAT_ID).trim();
const cfToken = (CLOUDFLARE_API_TOKEN || CLOUDFLARE_API_KEY || '').trim();
const cfAccountId = (CLOUDFLARE_ACCOUNT_ID || '').trim();

const cf = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: {
    Authorization: `Bearer ${cfToken}`,
    'Content-Type': 'application/json',
  },
});

async function getZoneId(domain) {
  const { data } = await cf.get('/zones', { params: { name: domain } });
  if (!data.success || !data.result || data.result.length === 0) {
    return null;
  }
  return data.result[0].id;
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  const app = express();
  app.use(express.json());
  app.use(usersRouter);

  const bot = new Telegraf(TELEGRAM_BOT_TOKEN.trim());

  app.all('/webhook-log', (req, res) => {
    const msg = `🔔 Запит! IP: ${req.ip} Метод: ${req.method}`;
    bot.telegram.sendMessage(allowedChatId, msg).catch((err) => console.error('Send webhook-log failed:', err.message));
    res.sendStatus(200);
  });

  bot.use((ctx, next) => {
    const chatId = ctx.chat?.id;
    if (chatId === undefined || String(chatId) !== allowedChatId) {
      return;
    }
    return next();
  });

  bot.use(async (ctx, next) => {
    const username = ctx.from?.username;

    if (!username) {
      await ctx.reply('У вас немає доступу');
      return;
    }

    const normalized = username.toLowerCase();
    const allowed = await AllowedUser.findOne({ username: normalized });
    if (!allowed) {
      await ctx.reply('У вас немає доступу');
      return;
    }
    console.log('Прийшло повідомлення від:', username);
    return next();
  });

  bot.start((ctx) => {
    return ctx.reply(`Вітаю, @${ctx.from.username}! Ви маєте доступ до бота.`);
  });

  bot.command('add_domain', async (ctx) => {
    const domain = ctx.message.text.split(/\s+/)[1];
    if (!domain) {
      return ctx.reply('Використання: /add_domain <domain>\nНаприклад: /add_domain example.com');
    }
    if (!cfToken || !cfAccountId) {
      return ctx.reply('Cloudflare API не налаштовано (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID).');
    }
    try {
      const { data } = await cf.post('/zones', {
        name: domain.trim(),
        account: { id: cfAccountId.trim() },
        type: 'full',
        jump_start: true,
      });
      if (!data.success) {
        const errMsg = (data.errors && data.errors[0] && data.errors[0].message) || JSON.stringify(data.errors);
        return ctx.reply(`Помилка Cloudflare: ${errMsg}`);
      }
      const ns = (data.result && data.result.name_servers) || [];
      const nsList = ns.length ? ns.join('\n') : '— не надано';
      return ctx.reply(`Домен ${domain} додано.\nNS сервери для реєстратора:\n${nsList}`);
    } catch (err) {
      const msg = err.response && err.response.data && err.response.data.errors && err.response.data.errors[0]
        ? err.response.data.errors[0].message
        : (err.message || 'Помилка запиту');
      return ctx.reply(`Помилка: ${msg}`);
    }
  });

  bot.command('dns_add', async (ctx) => {
    const args = ctx.message.text.split(/\s+/).slice(1);
    const [domain, type, name, ...contentParts] = args;
    const content = contentParts.join(' ').trim();
    if (!domain || !type || !name || !content) {
      return ctx.reply('Використання: /dns_add <domain> <type> <name> <content>\nНаприклад: /dns_add example.com A @ 1.2.3.4');
    }
    if (!cfToken) {
      return ctx.reply('Cloudflare API не налаштовано.');
    }
    try {
      const zoneId = await getZoneId(domain.trim());
      if (!zoneId) {
        return ctx.reply(`Зону ${domain} не знайдено в Cloudflare.`);
      }
      const { data } = await cf.post(`/zones/${zoneId}/dns_records`, {
        type: type.toUpperCase(),
        name: name.trim(),
        content: content,
        ttl: 1,
      });
      if (!data.success) {
        const errMsg = (data.errors && data.errors[0] && data.errors[0].message) || 'Помилка API';
        return ctx.reply(`Помилка: ${errMsg}`);
      }
      return ctx.reply(`DNS запис додано: ${data.result.type} ${data.result.name} → ${data.result.content}`);
    } catch (err) {
      const msg = err.response && err.response.data && err.response.data.errors && err.response.data.errors[0]
        ? err.response.data.errors[0].message
        : (err.message || 'Помилка запиту');
      return ctx.reply(`Помилка: ${msg}`);
    }
  });

  bot.command('dns_list', async (ctx) => {
    const domain = ctx.message.text.split(/\s+/)[1];
    if (!domain) {
      return ctx.reply('Використання: /dns_list <domain>\nНаприклад: /dns_list example.com');
    }
    if (!cfToken) {
      return ctx.reply('Cloudflare API не налаштовано.');
    }
    try {
      const zoneId = await getZoneId(domain.trim());
      if (!zoneId) {
        return ctx.reply(`Зону ${domain} не знайдено в Cloudflare.`);
      }
      const { data } = await cf.get(`/zones/${zoneId}/dns_records`);
      if (!data.success || !data.result) {
        return ctx.reply('Не вдалося отримати список записів.');
      }
      const lines = data.result.map((r) => `${r.type} ${r.name} → ${r.content}`).slice(0, 30);
      const text = lines.length ? lines.join('\n') : 'Записів немає.';
      return ctx.reply(`DNS записи для ${domain}:\n${text}`);
    } catch (err) {
      const msg = err.response && err.response.data && err.response.data.errors && err.response.data.errors[0]
        ? err.response.data.errors[0].message
        : (err.message || 'Помилка запиту');
      return ctx.reply(`Помилка: ${msg}`);
    }
  });

  app.listen(PORT || 3000, () => {
    console.log(`Express server on port ${PORT || 3000}`);
  });

  console.log('Launching Telegram bot...');
  bot.launch()
    .then(() => console.log('Telegram bot started'))
    .catch((err) => console.error('Telegram bot launch failed:', err.message || err));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
