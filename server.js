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
        rooms[roomId] = { host: socket.id, guest: null };
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId] && !rooms[roomId].guest) {
            socket.join(roomId);
            rooms[roomId].guest = socket.id;
            io.to(roomId).emit('syncStart'); // СТАРТ
        }
    });

    socket.on('inputSync', (data) => {
        socket.to(data.roomId).emit('inputSync', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server Live"));
