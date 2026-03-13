const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', (roomId) => {
        socket.join(roomId);
        rooms[roomId] = { host: socket.id, guest: null, readyCount: 0 };
    });

    socket.on('joinRoom', (roomId) => {
        if(rooms[roomId]) {
            socket.join(roomId);
            rooms[roomId].guest = socket.id;
            // Команда обоим: "Начинайте скачивать игру в память!"
            io.to(roomId).emit('startDownload'); 
        }
    });

    // Игрок сообщает, что файл игры скачан
    socket.on('playerReady', (roomId) => {
        if(rooms[roomId]) {
            rooms[roomId].readyCount++;
            // Если ОБА игрока скачали игру - даем команду на одновременный запуск
            if(rooms[roomId].readyCount === 2) {
                io.to(roomId).emit('bootEngine');
            }
        }
    });

    // Пересылка кнопок
    socket.on('inputSync', (data) => {
        socket.to(data.roomId).emit('inputSync', data);
    });
});

server.listen(process.env.PORT || 3000, () => console.log('Арена запущена'));
