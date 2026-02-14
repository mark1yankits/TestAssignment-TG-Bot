const BOT_COMMANDS = [
  { command: 'start', description: 'Вітання та перевірка доступу' },
  { command: 'help', description: 'Список усіх команд' },
  { command: 'add_domain', description: 'Додати дмен у Cloudflare, отримати NS сервери' },
  { command: 'dns_list', description: 'Список DNS записів для домену' },
  { command: 'dns_add', description: 'Додати DNS запис' },
  { command: 'dns_update', description: 'Оновити DNS запис (content)' },
  { command: 'dns_delete', description: 'Видалити DNS запис' },
];

const HELP_TEXT = `📋 Доступні команди:

/start — вітання
/help — цей список команд

☁️ Cloudflare:
/add_domain <domain> — додати домен (зона), отримати NS сервери
/dns_list <domain> — список DNS записів (показує id для видалення/оновлення)
/dns_add <domain> <type> <name> <content> — додати запис
  Приклад: /dns_add example.com A @ 1.2.3.4
/dns_update <domain> <record_id> <content> — оновити запис (новий content)
/dns_delete <domain> <record_id> — видалити запис (record_id з /dns_list)`;

const CF_NOT_CONFIGURED = 'Cloudflare API не налаштовано.';
const CF_ACCOUNT_REQUIRED = 'Cloudflare API не налаштовано (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID).';
const ZONE_NOT_FOUND = (domain) => `Зону ${domain} не знайдено в Cloudflare.`;

function registerCommands(bot, cf) {
  bot.start((ctx) => {
    return ctx.reply(
      `Вітаю, @${ctx.from.username}! Ви маєте доступ до бота.\n\nНапиши /help для списку команд.`
    );
  });

  bot.command('help', (ctx) => ctx.reply(HELP_TEXT));

  bot.command('add_domain', async (ctx) => {
    const domain = ctx.message.text.split(/\s+/)[1];
    if (!domain) {
      return ctx.reply('Використання: /add_domain <domain>\nНаприклад: /add_domain example.com');
    }
    if (!cf) return ctx.reply(CF_ACCOUNT_REQUIRED);
    try {
      const { name_servers } = await cf.createZone(domain.trim());
      const nsList = name_servers?.length ? name_servers.join('\n') : '— не надано';
      return ctx.reply(`Домен ${domain} додано.\nNS сервери для реєстратора:\n${nsList}`);
    } catch (err) {
      return ctx.reply(`Помилка: ${err.message}`);
    }
  });

  bot.command('dns_add', async (ctx) => {
    const args = ctx.message.text.split(/\s+/).slice(1);
    const [domain, type, name, ...contentParts] = args;
    const content = contentParts.join(' ').trim();
    if (!domain || !type || !name || !content) {
      return ctx.reply(
        'Використання: /dns_add <domain> <type> <name> <content>\nНаприклад: /dns_add example.com A @ 1.2.3.4'
      );
    }
    if (!cf) return ctx.reply(CF_NOT_CONFIGURED);
    try {
      const zoneId = await cf.getZoneId(domain.trim());
      if (!zoneId) return ctx.reply(ZONE_NOT_FOUND(domain));
      const result = await cf.createDnsRecord(zoneId, { type, name, content });
      return ctx.reply(`DNS запис додано: ${result.type} ${result.name} → ${result.content}`);
    } catch (err) {
      return ctx.reply(`Помилка: ${err.message}`);
    }
  });

  bot.command('dns_list', async (ctx) => {
    const domain = ctx.message.text.split(/\s+/)[1];
    if (!domain) {
      return ctx.reply('Використання: /dns_list <domain>\nНаприклад: /dns_list example.com');
    }
    if (!cf) return ctx.reply(CF_NOT_CONFIGURED);
    try {
      const zoneId = await cf.getZoneId(domain.trim());
      if (!zoneId) return ctx.reply(ZONE_NOT_FOUND(domain));
      const records = await cf.getDnsRecords(zoneId);
      const lines = records.map((r) => `${r.id} | ${r.type} ${r.name} → ${r.content}`).slice(0, 30);
      const text = lines.length ? lines.join('\n') : 'Записів немає.';
      return ctx.reply(`DNS записи для ${domain} (id для /dns_delete та /dns_update):\n${text}`);
    } catch (err) {
      return ctx.reply(`Помилка: ${err.message}`);
    }
  });

  bot.command('dns_update', async (ctx) => {
    const args = ctx.message.text.split(/\s+/).slice(1);
    const [domain, recordId, ...contentParts] = args;
    const content = contentParts.join(' ').trim();
    if (!domain || !recordId || !content) {
      return ctx.reply('Використання: /dns_update <domain> <record_id> <content>\nrecord_id — з /dns_list');
    }
    if (!cf) return ctx.reply(CF_NOT_CONFIGURED);
    try {
      const zoneId = await cf.getZoneId(domain.trim());
      if (!zoneId) return ctx.reply(ZONE_NOT_FOUND(domain));
      const result = await cf.updateDnsRecord(zoneId, recordId.trim(), { content });
      return ctx.reply(`DNS запис оновлено: ${result.type} ${result.name} → ${result.content}`);
    } catch (err) {
      return ctx.reply(`Помилка: ${err.message}`);
    }
  });

  bot.command('dns_delete', async (ctx) => {
    const args = ctx.message.text.split(/\s+/).slice(1);
    const [domain, recordId] = args;
    if (!domain || !recordId) {
      return ctx.reply('Використання: /dns_delete <domain> <record_id>\nrecord_id — з /dns_list');
    }
    if (!cf) return ctx.reply(CF_NOT_CONFIGURED);
    try {
      const zoneId = await cf.getZoneId(domain.trim());
      if (!zoneId) return ctx.reply(ZONE_NOT_FOUND(domain));
      await cf.deleteDnsRecord(zoneId, recordId.trim());
      return ctx.reply('DNS запис видалено.');
    } catch (err) {
      return ctx.reply(`Помилка: ${err.message}`);
    }
  });

  return BOT_COMMANDS;
}

module.exports = { registerCommands, BOT_COMMANDS };
