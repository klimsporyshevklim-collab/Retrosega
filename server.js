const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);

// Разрешаем все соединения для Socket.io
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    console.log('Кто-то подключился:', socket.id);

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

server.listen(process.env.PORT || 3000, () => console.log('Сервер запущен'));
