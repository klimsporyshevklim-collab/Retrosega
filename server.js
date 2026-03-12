const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.static('public'));

// Хранилище комнат
const rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', (roomId) => {
        socket.join(roomId);
        rooms[roomId] = { host: socket.id, guest: null, ready: 0 };
        console.log(`Room created: ${roomId}`);
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId]) {
            socket.join(roomId);
            rooms[roomId].guest = socket.id;
            // Уведомляем обоих, что пора скачивать игру
            io.to(roomId).emit('startDownload'); 
        } else {
            socket.emit('systemError', 'Комната не найдена');
        }
    });

    socket.on('playerReady', (roomId) => {
        if (rooms[roomId]) {
            rooms[roomId].ready++;
            if (rooms[roomId].ready === 2) {
                io.to(roomId).emit('bootEngine');
            }
        }
    });

    socket.on('inputSync', (data) => {
        socket.to(data.roomId).emit('inputSync', data);
    });
});

// Пинг для Render, чтобы не спал
setInterval(() => {
    http.get('https://retrosega.onrender.com/health');
}, 300000); // каждые 5 минут

server.listen(process.env.PORT || 3000, () => console.log("Server Live"));
