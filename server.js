const express = require('express');
const path = require('path');
const app = express();
app.use(express.static('public'));
app.listen(process.env.PORT || 3000, () => console.log('Арена запущена'));
