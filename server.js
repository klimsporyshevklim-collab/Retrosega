const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// Глобальный объект комнат
const rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Хост создает комнату
    socket.on('createRoom', (roomId) => {
        socket.join(roomId);
        rooms[roomId] = { host: socket.id, guest: null };
        console.log(`Room created: ${roomId}`);
    });

    // Гость заходит в комнату
    socket.on('joinRoom', (roomId) => {
        const room = rooms[roomId];
        if (room && !room.guest) {
            socket.join(roomId);
            room.guest = socket.id;
            console.log(`Guest joined room: ${roomId}`);
            // Даем команду на СИНХРОННЫЙ СТАРТ всем в комнате
            io.to(roomId).emit('syncStart', { roomId });
        } else {
            socket.emit('systemError', 'Комната не найдена или заполнена');
        }
    });

    socket.on('inputSync', (data) => {
        socket.to(data.roomId).emit('inputSync', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
