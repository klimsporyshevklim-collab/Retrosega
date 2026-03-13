const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    // Создание лобби
    socket.on('createRoom', (roomId) => {
        socket.join(roomId);
        rooms[roomId] = { host: socket.id, guest: null };
        console.log(`Лобби создано: ${roomId}`);
    });

    // Подключение к лобби
    socket.on('joinRoom', (roomId) => {
        if(rooms[roomId]) {
            socket.join(roomId);
            rooms[roomId].guest = socket.id;
            // Команда обоим игрокам: ЗАПУСК ЭМУЛЯТОРА!
            io.to(roomId).emit('syncStart'); 
            console.log(`Игрок 2 зашел в лобби: ${roomId}`);
        }
    });

    // Пересылка кнопок от одного игрока другому
    socket.on('inputSync', (data) => {
        socket.to(data.roomId).emit('inputSync', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер Арены запущен на порту ${PORT}`));
