const MESSAGES = {
  NO_ACCESS: 'У вас немає доступу',
};

function createChatGuard(allowedChatId) {
  return (ctx, next) => {
    const chatId = ctx.chat?.id;
    if (chatId === undefined || String(chatId) !== allowedChatId) {
      return;
    }
    return next();
  };
}

function createAllowedUserGuard(AllowedUserModel) {
  return async (ctx, next) => {
    const username = ctx.from?.username;
    if (!username) {
      await ctx.reply(MESSAGES.NO_ACCESS);
      return;
    }
    const normalized = username.toLowerCase();
    const allowed = await AllowedUserModel.findOne({ username: normalized });
    if (!allowed) {
      await ctx.reply(MESSAGES.NO_ACCESS);
      return;
    }
    console.log('Прийшло повідомлення від:', username);
    return next();
  };
}

module.exports = { createChatGuard, createAllowedUserGuard, MESSAGES };
