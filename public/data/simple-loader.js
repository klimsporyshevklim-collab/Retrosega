(function() {
    // 1. Состояние контроллеров (Битовая маска)
    // [Игрок1, Игрок2]
    window.InputState = [0, 0];

    // Битовая карта кнопок Libretro (Sega)
    const INPUT_MAP = {
        "B": 1 << 0,      // Кнопка B
        "Y": 1 << 1,      // Иногда C
        "SELECT": 1 << 2,
        "START": 1 << 3,  // Кнопка START
        "UP": 1 << 4,
        "DOWN": 1 << 5,
        "LEFT": 1 << 6,
        "RIGHT": 1 << 7,
        "A": 1 << 8,      // Кнопка A
        "X": 1 << 9,
        "L": 1 << 10,
        "R": 1 << 11
    };

    // 2. Настройка Emscripten модуля (Мост к WASM)
    window.Module = {
        canvas: document.getElementById('game-container'),
        noInitialRun: true,
        arguments: ['/sonic.bin'], // Аргумент запуска
        preRun: [],
        postRun: [],
        print: (text) => console.log("[CORE]: " + text),
        printErr: (text) => console.error("[CORE ERROR]: " + text),
        
        // ВАЖНО: Перехват запроса игры на ввод
        // Когда игра спрашивает "Что нажато?", мы отдаем наше число
        retro_input_state: function(port, device, index, id) {
            return window.InputState[port] || 0; 
        },
        
        onRuntimeInitialized: function() {
            console.log("ЯДРО ЗАГРУЖЕНО! ЗАПУСК ИГРЫ...");
            // Монтируем игру в виртуальную ФС
            fetch('/sonic.bin').then(r => r.arrayBuffer()).then(buffer => {
                window.Module.FS.writeFile('/sonic.bin', new Uint8Array(buffer));
                window.Module.callMain(['/sonic.bin']);
            });
        }
    };

    // 3. Функция управления (вызываем из index.html)
    window.updateController = function(playerIndex, button, isPressed) {
        const mask = INPUT_MAP[button];
        if (!mask) return;

        if (isPressed) {
            window.InputState[playerIndex] |= mask; // Добавить бит
        } else {
            window.InputState[playerIndex] &= ~mask; // Убрать бит
        }
        console.log(`P${playerIndex+1} Input: ${button} (${window.InputState[playerIndex]})`);
    };

    // 4. Загрузка самого ядра
    const script = document.createElement('script');
    script.src = '/data/cores/genesis_plus_gx_libretro.js';
    document.body.appendChild(script);

})();
