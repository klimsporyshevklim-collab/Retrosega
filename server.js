const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Тут живет состояние игры
let gameState = { players: {} };

io.on('connection', (socket) => {
    // Регистрация игрока
    socket.on('join', (id) => {
        gameState.players[socket.id] = { x: 0, y: 0 };
        socket.emit('init', gameState);
    });

    // Прием инпутов (КНОПКИ)
    socket.on('input', (data) => {
        // Сервер сам меняет состояние мира
        // И рассылает всем обновленную картинку
        io.emit('update', gameState);
    });
});

server.listen(3000);
