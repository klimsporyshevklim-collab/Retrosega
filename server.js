const express = require('express');
const app = express();
app.use(express.static('public'));
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Сигнальный сервер: игроки обмениваются здесь только ID своих сессий
io.on('connection', (socket) => {
    socket.on('offer', (data) => socket.broadcast.emit('offer', data));
    socket.on('answer', (data) => socket.broadcast.emit('answer', data));
    socket.on('candidate', (data) => socket.broadcast.emit('candidate', data));
});

server.listen(process.env.PORT || 3000, () => console.log('Сигнальный сервер запущен'));
