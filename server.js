const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Настройка Socket.io с поддержкой CORS для Telegram WebApp
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Хранилище игроков
const players = new Map();

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // При входе игрока
    socket.on('playerJoin', (playerData) => {
        players.set(socket.id, { id: socket.id, ...playerData });
        socket.broadcast.emit('playerJoined', { id: socket.id, ...playerData });
    });

    // Обновление координат
    socket.on('playerUpdate', (playerData) => {
        if (players.has(socket.id)) {
            const player = players.get(socket.id);
            Object.assign(player, playerData);
            socket.broadcast.emit('remotePlayerUpdate', { id: socket.id, ...playerData });
        }
    });

    socket.on('disconnect', () => {
        players.delete(socket.id);
        io.emit('playerLeft', socket.id);
    });
});

// Health check для Render.com
app.get('/health', (req, res) => res.status(200).send('OK'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
