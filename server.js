const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('createRoom', (roomId) => socket.join(roomId));
    socket.on('joinRoom', (roomId) => socket.join(roomId));

    // Синхронизация нажатий: отправляем всем в комнате, кроме отправителя
    socket.on('inputSync', (data) => {
        socket.to(data.roomId).emit('inputSync', data);
    });
});

server.listen(process.env.PORT || 3000, () => console.log("Server running..."));
