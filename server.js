const express = require('express');
const app = express();

// Просто раздаем папку public
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Бизнес-сервер запущен на порту ${PORT}`));
