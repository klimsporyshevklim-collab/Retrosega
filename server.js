const express = require('express');
const { ExpressPeerServer } = require('peer');
const http = require('http');
const app = express();
const server = http.createServer(app);

app.use(express.static('public'));

const peerServer = ExpressPeerServer(server, { path: '/myapp' });
app.use('/peerjs', peerServer);

server.listen(process.env.PORT || 3000, () => console.log('Арена запущена'));
