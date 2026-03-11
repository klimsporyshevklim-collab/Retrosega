const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.static('public'));

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

io.on('connection', (socket) => {
    console.log(`Игрок подключился: ${socket.id}`);

    // 1. Создание лобби (Хост)
    socket.on('createRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Лобби создано: ${roomId}`);
    });

    // 2. Подключение Игрока 2
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Игрок зашел в лобби: ${roomId}`);
        // Говорим хосту, что P2 готов
        socket.to(roomId).emit('peerConnected');
    });

    // 3. Синхронизация кнопок (Netplay)
    socket.on('inputSync', (data) => {
        // Пересылаем нажатие всем в комнате, кроме отправителя
        socket.to(data.roomId).emit('inputSync', data);
    });

    socket.on('disconnect', () => {
        console.log(`Игрок отключился: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
