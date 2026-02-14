const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');

const config = require('./config');
const AllowedUser = require('./models/AllowedUser');
const usersRouter = require('./routes/users');
const zonesRouter = require('./routes/zones');
const { createChatGuard, createAllowedUserGuard } = require('./bot/middleware');
const { registerCommands, BOT_COMMANDS } = require('./bot/commands');
const { createCloudflareService } = require('./services/cloudflare');

async function run() {
  await mongoose.connect(config.mongo.uri);
  console.log('MongoDB connected');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(usersRouter);
  app.use(zonesRouter);

  const cf = createCloudflareService(config.cloudflare.token, config.cloudflare.accountId);
  const bot = new Telegraf(config.telegram.botToken);

  const allowedChatId = config.telegram.allowedChatId;
  await bot.telegram.setMyCommands(BOT_COMMANDS);

  app.all('/webhook-log', (req, res) => {
    const msg = `🔔 Запит! IP: ${req.ip} Метод: ${req.method}`;
    bot.telegram.sendMessage(allowedChatId, msg).catch((err) => console.error('Send webhook-log failed:', err.message));
    res.sendStatus(200);
  });

  bot.use(createChatGuard(allowedChatId));
  bot.use(createAllowedUserGuard(AllowedUser));
  registerCommands(bot, cf);

  app.listen(config.server.port, () => {
    console.log(`Express server on port ${config.server.port}`);
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
