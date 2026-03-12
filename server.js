const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

// Хранилище активных комнат
const rooms = {};

io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);

    // Создание комнаты
    socket.on('createRoom', (roomId) => {
        socket.join(roomId);
        rooms[roomId] = { host: socket.id, guest: null };
        console.log(`Комната создана: ${roomId}`);
    });

    // Вход в комнату
    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId]) {
            socket.join(roomId);
            rooms[roomId].guest = socket.id;
            // Уведомляем обоих, что игра началась
            io.to(roomId).emit('gameStart');
            console.log(`Игрок 2 зашел в комнату: ${roomId}`);
        } else {
            socket.emit('error', 'Комната не найдена');
        }
    });

    // Передача нажатий кнопок
    socket.on('inputSync', (data) => {
        // Пересылаем нажатие всем в этой комнате, кроме отправителя
        socket.to(data.roomId).emit('inputSync', data);
    });

    socket.on('disconnect', () => {
        console.log('Игрок отключился');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
