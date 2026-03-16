const express = require('express');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');

const app = express();
const port = process.env.PORT || 3000;

const BOT_TOKEN = '8693145166:AAHaAecx_bOmEUeni6zUfM9lax-Me3NLa8Q'; 
const WEB_APP_URL = 'https://retrosega.onrender.com';

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply(
        '👾 Добро пожаловать в PIXEL ARENA!\n\nЖми на огромную кнопку ниже, чтобы запустить эмулятор и начать играть.',
        Markup.inlineKeyboard([
            [Markup.button.webApp('🔥 ОТКРЫТЬ PIXEL ARENA', WEB_APP_URL)]
        ])
    );
});

// ВАЖНО: Вместо bot.launch() мы используем Webhook
bot.telegram.setWebhook(`${WEB_APP_URL}/bot${BOT_TOKEN}`);
app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Сервер и бот запущены на порту ${port}`);
});
