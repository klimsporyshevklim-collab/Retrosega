const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Раздаем папку public
app.use(express.static(path.join(__dirname, 'public')));

// Фейковый ответ (Заглушка), чтобы фронтенд не зависал
app.post('/api/user-data', (req, res) => {
    res.json({ 
        success: true, 
        user: { telegramId: 1, username: "TestPlayer", balance: 5000 } 
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT} (Тестовый режим без БД)`));
