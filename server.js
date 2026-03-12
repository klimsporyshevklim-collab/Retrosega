const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', (roomId) => {
        socket.join(roomId);
        rooms[roomId] = { host: socket.id, guest: null };
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId]) {
            socket.join(roomId);
            rooms[roomId].guest = socket.id;
            io.to(roomId).emit('syncStart'); // Запуск у обоих
        }
    });

    socket.on('inputSync', (data) => {
        // Передаем нажатие всем в комнате (включая себя для проверки или только другому)
        socket.to(data.roomId).emit('inputSync', data);
    });

    socket.on('disconnect', () => { /* Логика выхода */ });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
