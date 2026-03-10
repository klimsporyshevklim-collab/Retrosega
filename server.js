const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configure Socket.io for production
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    // Allow client to serve socket.io.js
    serveClient: true,
    // Path for socket.io client
    path: '/socket.io'
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected players
const players = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Handle player joining
    socket.on('playerJoin', (playerData) => {
        console.log(`Player joined: ${socket.id}`, playerData);

        // Store player data
        players.set(socket.id, {
            id: socket.id,
            ...playerData,
            lastUpdate: Date.now()
        });

        // Send current players to the new player
        const otherPlayers = Array.from(players.values())
            .filter(player => player.id !== socket.id);

        socket.emit('currentPlayers', otherPlayers);

        // Notify other players about the new player
        socket.broadcast.emit('playerJoined', players.get(socket.id));
    });

    // Handle player movement updates
    socket.on('playerUpdate', (playerData) => {
        const player = players.get(socket.id);
        if (player) {
            // Update player data
            Object.assign(player, {
                ...playerData,
                lastUpdate: Date.now()
            });

            // Broadcast to other players
            socket.broadcast.emit('remotePlayerUpdate', {
                id: socket.id,
                ...playerData
            });
        }
    });

    // Handle player disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);

        const player = players.get(socket.id);
        if (player) {
            players.delete(socket.id);
            // Notify other players
            socket.broadcast.emit('playerLeft', socket.id);
        }
    });

    // Handle ping for latency measurement
    socket.on('ping', (timestamp) => {
        socket.emit('pong', timestamp);
    });
});

// API endpoints
app.post('/api/user-data', (req, res) => {
    res.json({
        success: true,
        user: {
            telegramId: req.body.telegramId || 1,
            username: req.body.username || "Player",
            balance: 5000
        }
    });
});

// Health check endpoint for Render.com
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Detailed health check endpoint
app.get('/health/detailed', (req, res) => {
    res.json({
        status: 'ok',
        players: players.size,
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    console.log(`🚀 Multiplayer Battletoads server running on ${protocol}://localhost:${PORT}`);
    console.log(`📊 Health check: ${protocol}://localhost:${PORT}/health`);
    console.log(`👥 Connected players: ${players.size}`);
});
