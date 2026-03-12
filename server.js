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

const rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('createRoom', (roomId) => {
        socket.join(roomId);
        rooms[roomId] = { host: socket.id, guest: null };
        console.log('Room created:', roomId);
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId] && !rooms[roomId].guest) {
            socket.join(roomId);
            rooms[roomId].guest = socket.id;
            // ВАЖНО: Даем команду обоим игрокам запустить эмулятор одновременно
            io.to(roomId).emit('syncStart');
            console.log('Guest joined, starting sync...');
        } else {
            socket.emit('error', 'Room full or not found');
        }
    });

    socket.on('inputSync', (data) => {
        // Прокидываем нажатие кнопки второму игроку в комнате
        socket.to(data.roomId).emit('inputSync', data);
    });

    socket.on('disconnect', () => {
        // Очистка комнат при дисконнекте (упрощенно)
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));
