// game.js - Main Phaser game logic with state-based system

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameState = 'MENU'; // 'MENU', 'SOLO', 'MULTIPLAYER'
        this.socket = null;
        this.physicsEngine = new BattletoadsPhysics();
        this.player = null;
        this.playerSprite = null;
        this.cursors = null;
        this.remotePlayers = new Map();
        this.connectionStatus = 'Disconnected';
        this.playerCount = 0;
    }

    preload() {
        // Load assets
        this.load.image('rash', '/assets/rash.png');
    }

    create() {
        // Initialize input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-ONE', () => {
            if (this.gameState === 'MENU') {
                this.gameState = 'SOLO';
                this.startGame();
            }
        });
        this.input.keyboard.on('keydown-TWO', () => {
            if (this.gameState === 'MENU') {
                this.gameState = 'MULTIPLAYER';
                this.startGame();
            }
        });

        // Try to initialize Socket.io
        try {
            this.socket = io();
            this.socket.on('connect', () => {
                this.connectionStatus = 'Connected';
                this.updateUI();
            });
            this.socket.on('disconnect', () => {
                this.connectionStatus = 'Disconnected';
                this.updateUI();
            });
            this.socket.on('playerCount', (count) => {
                this.playerCount = count;
                this.updateUI();
            });
            this.socket.on('playerUpdate', (data) => {
                this.updateRemotePlayer(data);
            });
        } catch (error) {
            console.warn('Socket.io initialization failed, falling back to SOLO mode:', error);
            this.gameState = 'SOLO';
            this.startGame();
        }
    }

    startGame() {
        // Initialize player
        this.player = this.physicsEngine.initPlayer('local', { xPos: 400, zPos: 200 });
        this.playerSprite = this.add.sprite(this.player.xPos, 400 - this.player.zPos, 'rash');
        this.playerSprite.setScale(0.5);
    }

    update() {
        if (this.gameState === 'MENU') {
            return; // Wait for input
        }

        // Handle input
        const input = {
            left: this.cursors.left.isDown,
            right: this.cursors.right.isDown,
            up: this.cursors.up.isDown,
            down: this.cursors.down.isDown,
            jump: this.cursors.space.isDown
        };

        // Update physics
        this.physicsEngine.updateObject(this.player, input);

        // Update sprite position
        this.playerSprite.x = this.player.xPos;
        this.playerSprite.y = 400 - this.player.zPos; // Assuming screen height 600, higher z = lower y

        // If multiplayer, emit update
        if (this.gameState === 'MULTIPLAYER' && this.socket) {
            this.socket.emit('playerUpdate', {
                id: 'local',
                xPos: this.player.xPos,
                zPos: this.player.zPos,
                xSpeed: this.player.xSpeed,
                zSpeed: this.player.zSpeed
            });
        }
    }

    updateUI() {
        document.getElementById('connection-status').textContent = this.connectionStatus;
        document.getElementById('player-count').textContent = this.playerCount;
    }

    updateRemotePlayer(data) {
        if (data.id === 'local') return; // Ignore own updates
        let remoteSprite = this.remotePlayers.get(data.id);
        if (!remoteSprite) {
            remoteSprite = this.add.sprite(data.xPos, 400 - data.zPos, 'rash');
            remoteSprite.setScale(0.5);
            remoteSprite.setTint(0xff0000); // Red for remote
            this.remotePlayers.set(data.id, remoteSprite);
        } else {
            remoteSprite.x = data.xPos;
            remoteSprite.y = 400 - data.zPos;
        }
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: GameScene,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // No gravity, handled by BattletoadsPhysics
            debug: false
        }
    }
};

const game = new Phaser.Game(config);
