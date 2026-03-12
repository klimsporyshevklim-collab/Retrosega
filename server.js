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

    socket.on('createRoom', (roomId) => {
        socket.join(roomId);
        // readyCount - счетчик загрузившихся игроков
        rooms[roomId] = { host: socket.id, guest: null, readyCount: 0 };
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId] && !rooms[roomId].guest) {
            socket.join(roomId);
            rooms[roomId].guest = socket.id;
            // Говорим обоим: "Начинайте скачивать игру"
            io.to(roomId).emit('startDownload'); 
        }
    });

    // Игрок сообщает, что скачал игру и готов
    socket.on('playerReady', (roomId) => {
        if (rooms[roomId]) {
            rooms[roomId].readyCount++;
            // Если оба скачали - даем команду на одновременный старт ядра
            if (rooms[roomId].readyCount === 2) {
                io.to(roomId).emit('bootEngine');
            }
        }
    });

    socket.on('inputSync', (data) => {
        socket.to(data.roomId).emit('inputSync', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is running on ${PORT}`));
