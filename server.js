const express = require('express');
const path = require('path');
const app = express();

// Указываем, что файлы лежат в public
app.use(express.static(path.join(__dirname, 'public')));

app.listen(process.env.PORT || 3000, () => console.log('Арена запущена'));
