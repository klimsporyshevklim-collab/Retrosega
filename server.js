const express = require('express');
const path = require('path');
const app = express();

// Это "железная" привязка к папке public
app.use(express.static(path.join(__dirname, 'public')));

// Если кто-то просит просто сайт - отдаем index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Если кто-то просит /arena - отдаем arena.html
app.get('/arena', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'arena.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на ${PORT}`));
