// Найди место, где у тебя стоит проверка на 'MENU', 'SOLO' или 'MULTIPLAYER'
// И временно замени на это:

function update(time, delta) {
    // ВРЕМЕННО ЗАПУСКАЕМ ИГРУ СРАЗУ
    // Вместо проверки на меню:
    
    handleLocalInput();
    physics.updateObject(localPlayer, { left: cursors.left.isDown, right: cursors.right.isDown, jump: cursors.up.isDown });
    
    // Рисуем
    playerSprite.x = localPlayer.xPos;
    playerSprite.y = 150 + localPlayer.zPos;
    
    // Синхронизация
    socket.emit('playerUpdate', { x: localPlayer.xPos, z: localPlayer.zPos });
}
