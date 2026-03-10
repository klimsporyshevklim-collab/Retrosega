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

const PORT = process.env.PORT || 3001; // Render.com compatibility

// Middleware
app.use(cors());
app.use(express.static('public'));

// Health check endpoint for Render.com
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Socket.io logic
let playerCount = 0;

io.on('connection', (socket) => {
    playerCount++;
    console.log(`Player connected: ${socket.id}. Total players: ${playerCount}`);
    
    // Send current player count
    io.emit('playerCount', playerCount);
    
    socket.on('playerUpdate', (data) => {
        // Broadcast to other players
        socket.broadcast.emit('playerUpdate', data);
    });
    
    socket.on('disconnect', () => {
        playerCount--;
        console.log(`Player disconnected: ${socket.id}. Total players: ${playerCount}`);
        io.emit('playerCount', playerCount);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
