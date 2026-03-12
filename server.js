const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', (roomId) => {
        socket.join(roomId);
        rooms[roomId] = { host: socket.id, guest: null, hostReady: false, guestReady: false };
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId]) {
            socket.join(roomId);
            rooms[roomId].guest = socket.id;
            io.to(roomId).emit('waitingForReady');
        }
    });

    socket.on('playerReady', (roomId) => {
        if (!rooms[roomId]) return;
        if (socket.id === rooms[roomId].host) rooms[roomId].hostReady = true;
        else rooms[roomId].guestReady = true;

        if (rooms[roomId].hostReady && rooms[roomId].guestReady) {
            io.to(roomId).emit('syncStart'); // СТАРТ ОДНОВРЕМЕННО
        }
    });

    socket.on('inputSync', (data) => {
        socket.to(data.roomId).emit('inputSync', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
