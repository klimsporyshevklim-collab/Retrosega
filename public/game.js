const config = {
    type: Phaser.AUTO,
    width: 320, height: 224, // Оригинальное разрешение Sega
    physics: { default: 'arcade' },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);
let player, gameLogic, mapLoader;

function preload() {
    this.load.image('rash', 'assets/rash.png');
}

function create() {
    gameLogic = new GameLogic();
    mapLoader = new LevelMapLoader(); 
    player = { x: 100, y: 100, z: 0, vx: 0, vz: 0, isGrounded: true };
}

function update() {
    const cursors = this.input.keyboard.createCursorKeys();
    const input = { left: cursors.left.isDown, right: cursors.right.isDown, jump: cursors.up.isDown };
    
    // Вызываем логику Сеги!
    gameLogic.processGameTick(player, input, mapLoader);
    
    // Рисуем
    // ...
}
