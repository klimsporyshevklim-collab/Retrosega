const express = require('express');
const path = require('path');
const { Telegraf, Markup } = require('telegraf');

const app = express();
const port = process.env.PORT || 3000;

// ==========================================
// 1. НАСТРОЙКА БОТА
// ==========================================
// Твой уникальный токен от BotFather:
const BOT_TOKEN = '8693145166:AAHaAecx_bOmEUeni6zUfM9lax-Me3NLa8Q'; 
// Ссылка на твое приложение:
const WEB_APP_URL = 'https://retrosega.onrender.com';

const bot = new Telegraf(BOT_TOKEN);

// Когда человек пишет /start, бот отправляет этот текст и огромную кнопку:
bot.start((ctx) => {
    ctx.reply(
        '👾 Добро пожаловать в PIXEL ARENA!\n\nЖми на огромную кнопку ниже, чтобы запустить эмулятор и начать играть.',
        Markup.inlineKeyboard([
            [Markup.button.webApp('🔥 ОТКРЫТЬ PIXEL ARENA', WEB_APP_URL)]
        ])
    );
});

// Запуск самого бота
bot.launch();

// ==========================================
// 2. НАСТРОЙКА СЕРВЕРА (чтобы сайт работал на Render)
// ==========================================
// Говорим серверу отдавать файлы из текущей папки
app.use(express.static(__dirname));

// При заходе по ссылке отдаем твой index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск веб-сервера
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

// Плавная остановка бота при выключении сервера
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
