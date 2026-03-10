const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Рассылаем всем остальным игрокам то, что прислал один игрок
    socket.on('playerUpdate', (data) => {
        socket.broadcast.emit('remotePlayerUpdate', { id: socket.id, ...data });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log('Multiplayer Relay Server Live'));
