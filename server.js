const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Хост создает комнату
    socket.on('createRoom', (roomId) => {
        socket.join(roomId);
        rooms[roomId] = { host: socket.id, guest: null };
        console.log(`Room created: ${roomId} by ${socket.id}`);
    });

    // Гость входит в комнату
    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId] && !rooms[roomId].guest) {
            socket.join(roomId);
            rooms[roomId].guest = socket.id;
            console.log(`Guest ${socket.id} joined room: ${roomId}`);
            
            // Даем команду СТАРТ обоим игрокам в этой комнате
            io.to(roomId).emit('syncStart', { roomId });
        } else {
            socket.emit('systemError', 'Комната не найдена или заполнена');
        }
    });

    // Трансляция кнопок
    socket.on('inputSync', (data) => {
        // Пересылаем нажатие всем в комнате, кроме того кто нажал
        socket.to(data.roomId).emit('inputSync', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is live on port ${PORT}`));
