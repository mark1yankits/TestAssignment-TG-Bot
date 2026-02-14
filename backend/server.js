require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

const AllowedUser = require('./models/AllowedUser');
const usersRouter = require('./routes/users');

const {
  TELEGRAM_BOT_TOKEN,
  ALLOWED_CHAT_ID,
  MONGO_URI,
  PORT,
} = process.env;

if (!TELEGRAM_BOT_TOKEN || !ALLOWED_CHAT_ID || !MONGO_URI) {
  console.error('Missing required env: TELEGRAM_BOT_TOKEN, ALLOWED_CHAT_ID, MONGO_URI');
  process.exit(1);
}

const allowedChatId = String(ALLOWED_CHAT_ID).trim();

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  const app = express();
  app.use(express.json());
  app.use(usersRouter);

  const bot = new Telegraf(TELEGRAM_BOT_TOKEN.trim());

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
    console.log("Прийшло повідомлення від:", username);
    return next();
  });

  bot.start((ctx) => {
    return ctx.reply(`Вітаю, @${ctx.from.username}! Ви маєте доступ до бота.`);
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
