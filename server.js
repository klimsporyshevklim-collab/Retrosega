const express = require('express');
const app = express();
const path = require('path');

// Раздаем статику из public
app.use(express.static(path.join(__dirname, 'public')));

// Обработка запуска
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
