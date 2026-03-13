const express = require('express');
const app = express();
const path = require('path');

app.use(express.static('public'));

// Если кто-то заходит на /arena, отдаем арену
app.get('/arena', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/arena.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Арена готова!'));
