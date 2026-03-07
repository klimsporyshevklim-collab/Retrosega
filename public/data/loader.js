(async function() {
    const scripts = [
        "emulator.js", "nipplejs.js", "shaders.js", "storage.js",
        "gamepad.js", "GameManager.js", "socket.io.min.js", "compression.js"
    ];

    const folderPath = (path) => path.substring(0, path.length - path.split("/").pop().length);
    let scriptPath = (typeof window.EJS_pathtodata === "string") ? window.EJS_pathtodata : folderPath((new URL(document.currentScript.src)).pathname);
    if (!scriptPath.endsWith("/")) scriptPath += "/";

    function loadScript(file) {
        return new Promise(function(resolve) {
            let script = document.createElement("script");
            script.src = ("undefined" != typeof EJS_paths && typeof EJS_paths[file] === "string") ? EJS_paths[file] : (file.endsWith("emulator.min.js") ? scriptPath + file : scriptPath + "src/" + file);
            script.onload = resolve;
            script.onerror = () => filesmissing(file).then(resolve);
            document.head.appendChild(script);
        })
    }

    function loadStyle(file) {
        return new Promise(function(resolve) {
            let css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = ("undefined" != typeof EJS_paths && typeof EJS_paths[file] === "string") ? EJS_paths[file] : scriptPath + file;
            css.onload = resolve;
            css.onerror = () => filesmissing(file).then(resolve);
            document.head.appendChild(css);
        })
    }

    async function filesmissing(file) {
        console.error("Failed to load " + file);
        if (file.includes(".min.") && !file.includes("socket")) {
            if (file === "emulator.min.js") {
                for (let i = 0; i < scripts.length; i++) await loadScript(scripts[i]);
            } else {
                await loadStyle("emulator.css");
            }
        }
    }

    if (("undefined" != typeof EJS_DEBUG_XX && true === EJS_DEBUG_XX)) {
        for (let i = 0; i < scripts.length; i++) await loadScript(scripts[i]);
        await loadStyle("emulator.css");
    } else {
        await loadScript("emulator.min.js");
        await loadStyle("emulator.min.css");
    }

    const config = {};
    config.gameUrl = window.EJS_gameUrl;
    config.dataPath = scriptPath;
    config.system = window.EJS_core;
    // ... (остальные поля конфига остаются прежними)
    config.filePaths = window.EJS_paths;

    window.EJS_emulator = new EmulatorJS(EJS_player, config);
    
    // ==========================================
    // ВСТРОЕННЫЙ БЭКДОР ДЛЯ МУЛЬТИПЛЕЕРА
    // ==========================================
    window.ArenaBridge = {
        press: function(btnName) {
            if (window.EJS_emulator && window.EJS_emulator.gamepadState) {
                // Маппинг кнопок Sega (индексы геймпада)
                const map = { "UP": 12, "DOWN": 13, "LEFT": 14, "RIGHT": 15, "A": 0, "B": 1, "C": 2, "START": 9 };
                const btnIndex = map[btnName];
                if (btnIndex !== undefined) {
                    window.EJS_emulator.gamepadState[btnIndex] = 1;
                    setTimeout(() => { window.EJS_emulator.gamepadState[btnIndex] = 0; }, 100);
                }
            }
        }
    };
    console.log("ArenaBridge initialized!");
})();
