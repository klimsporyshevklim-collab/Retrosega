const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ❌ ВСТАВЬ СВОЮ ССЫЛКУ НА MONGODB ❌
const MONGO_URI = "mongodb+srv://твой_логин:твой_пароль@cluster.mongodb.net/retrosega";

mongoose.connect(MONGO_URI).then(() => console.log('✅ База MongoDB активна')).catch(err => console.error(err));

const User = mongoose.model('User', new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    username: String,
    balance: { type: Number, default: 1000 }
}));

// ==========================================
// 🤖 АВТОНОМНЫЙ ИИ-СУДЬЯ (HEURISTIC ENGINE)
// ==========================================
function localReferee(game, score, telemetry) {
    console.log(`Анализ матча: ${game}, Результат: ${score}`);

    // Правило 1: Проверка на пустую игру
    if (!telemetry || telemetry.length < 5) {
        return { status: "reject", reason: "Матч слишком короткий (Cheat/Error)" };
    }

    // Правило 2: SONIC (Проверка времени)
    if (game.includes('sonic')) {
        const minTimePossible = 15000; // Минимальное время прохождения уровня - 15 сек
        if (score < minTimePossible) {
            return { status: "reject", reason: "Невозможная скорость (Ниже TAS лимита)" };
        }
    }

    // Правило 3: Анализ "прыжков" в телеметрии (Анти-телепорт)
    for (let i = 1; i < telemetry.length; i++) {
        const timeDiff = telemetry[i].time_offset - telemetry[i-1].time_offset;
        // Если между кадрами огромный разрыв в очках за 0 секунд
        if (timeDiff < 100 && (telemetry[i].score - telemetry[i-1].score) > 1000) {
            return { status: "reject", reason: "Обнаружена подмена памяти (Score Teleport)" };
        }
    }

    return { status: "approve", reason: "Матч проверен: Аномалий не обнаружено" };
}

// --- API: ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ---
app.post('/api/user-data', async (req, res) => {
    try {
        const tgData = req.body.telegramUser;
        if (!tgData) return res.status(400).json({ success: false });
        let user = await User.findOne({ telegramId: tgData.id });
        if (!user) user = await User.create({ telegramId: tgData.id, username: tgData.first_name });
        res.json({ success: true, user });
    } catch (e) { res.status(500).send(e.message); }
});

// --- API: ПРОВЕРКА МАТЧА (БЕЗ GOOGLE API) ---
app.post('/api/verify-match', async (req, res) => {
    const { telegramId, game, score, telemetry } = req.body;

    // Вызываем нашего встроенного судью
    const verdict = localReferee(game, score, telemetry);

    if (verdict.status === 'approve') {
        const reward = 50; // Награда за честную игру
        const updatedUser = await User.findOneAndUpdate(
            { telegramId },
            { $inc: { balance: reward } },
            { new: true }
        );
        return res.json({ 
            status: 'approve', 
            reason: verdict.reason, 
            newBalance: updatedUser.balance 
        });
    } else {
        return res.json(verdict);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер Арены v2.0 (No-API) на порту ${PORT}`));
