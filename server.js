const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Хранилище: { "ABCD": { host: "socketId" } }
const rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', (roomId) => {
        rooms[roomId] = { host: socket.id };
        socket.join(roomId);
        console.log("Комната создана:", roomId);
    });

    socket.on('checkRoom', (roomId, callback) => {
        if (rooms[roomId]) {
            callback({ exists: true });
        } else {
            callback({ exists: false });
        }
    });
});

server.listen(process.env.PORT || 3000);
