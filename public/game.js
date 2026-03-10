// Game state
let socket;
let localPlayer;
let remotePlayers = new Map(); // Используем Map для хранения
let physics;
let cursors;
let gameLogic;
let mapLoader;

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjMDA4MEZGIi8+Cjwvc3ZnPg==');
    this.load.image('background', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDAwIi8+Cjwvc3ZnPg==');
}

function create() {
    // 1. Инициализация сети
    const isProduction = window.location.protocol === 'https:';
    const serverUrl = isProduction ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:3000';
    socket = io(serverUrl);

    // 2. Инициализация движка
    physics = new BattletoadsPhysics();
    gameLogic = new GameLogic();
    mapLoader = new LevelMapLoader();
    
    this.add.tileSprite(0, 0, 2000, 2000, 'background').setOrigin(0, 0);
    cursors = this.input.keyboard.createCursorKeys();

    // 3. Создание локального игрока
    localPlayer = physics.initPlayer('me', {xPos: 400, yPos: 300, zPos: 0});
    localPlayer.sprite = this.add.sprite(400, 300, 'player').setTint(0x00ff00).setScale(2);

    // 4. Обработчики Socket.io (внутри create, чтобы был доступ к `this`)
    socket.on('connect', () => {
        window.updateConnectionStatus(true, 1);
        socket.emit('playerJoin', { x: localPlayer.xPos, z: localPlayer.zPos });
    });

    socket.on('remotePlayerUpdate', (data) => {
        if (!remotePlayers.has(data.id)) {
            let s = this.add.sprite(data.x, 150 + data.z, 'player').setTint(0xff0000).setScale(2);
            remotePlayers.set(data.id, { sprite: s, lastUpdate: Date.now() });
        }
        let rp = remotePlayers.get(data.id);
        rp.sprite.setPosition(data.x, 150 + data.z);
        rp.lastUpdate = Date.now();
    });
}

function update(time, delta) {
    if (!localPlayer) return;

    const input = {
        left: cursors.left.isDown,
        right: cursors.right.isDown,
        jump: cursors.up.isDown
    };

    // Обновление логики
    physics.updateObject(localPlayer, input);
    
    // Синхронизация спрайта
    localPlayer.sprite.x = localPlayer.xPos;
    localPlayer.sprite.y = 150 + localPlayer.zPos;

    // Сеть
    socket.emit('playerUpdate', { x: localPlayer.xPos, z: localPlayer.zPos, state: localPlayer.state });
}
