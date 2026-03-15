const express = require('express');
const path = require('path');
const app = express();

// Раздаем все файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Если зашли на /arena, отдаем арену
app.get('/arena', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'arena.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Арена запущена на порту ' + PORT));
