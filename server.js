const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
app.use(express.static('public'));
io.on('connection', (socket) => {
    socket.on('input', (data) => socket.broadcast.emit('input', data));
});
server.listen(process.env.PORT || 3000, () => console.log("Server is running..."));
