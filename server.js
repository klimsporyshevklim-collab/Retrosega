const express = require('express');
const { ExpressPeerServer } = require('peer');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Раздаем статику
app.use(express.static('public'));

// Подключаем PeerServer (сигнальный сервер для P2P)
const peerServer = ExpressPeerServer(server, {
    path: '/myapp'
});

app.use('/peerjs', peerServer);

server.listen(process.env.PORT || 3000, () => console.log('Arena P2P активна'));
