const express = require('express');
const noblox = require('noblox.js');
const app = express();

app.use(express.json());

const GROUP_ID = 34143364;
const COOKIE = process.env.ROBLOSECURITY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

noblox.setCookie(COOKIE, false).then(() => {
    console.log("Cookie yuklendi (Dogrulama atlandi)!");
}).catch((err) => {
    console.error("Giris hatasi:", err.message);
});

app.post('/changerank', async (req, res) => {
    try {
        const { adminName, playerName, newRank } = req.body;

        // 1. Oyuncunun Roblox ID'sini al
        const userId = await noblox.getIdFromUsername(playerName);

        // 2. Grubun tüm rollerini çek
        const roles = await noblox.getRoles(GROUP_ID);

        // 3. Eski rütbe numarasını al (0-255) ve ismini listeden eşleştir
        const oldRankNum = await noblox.getRankInGroup(GROUP_ID, userId);
        const oldRoleObj = roles.find(r => r.rank === oldRankNum);
        const oldRole = oldRoleObj ? oldRoleObj.name : "Grupta Değil / Misafir";

        // 4. Yeni rütbenin ismini listeden eşleştir
        const targetRankNum = Number(newRank);
        const newRoleObj = roles.find(r => r.rank === targetRankNum || r.id === targetRankNum);
        const newRole = newRoleObj ? newRoleObj.name : `Rütbe ID: ${targetRankNum}`;

        // 5. Rütbeyi Roblox'ta güncelle
        await noblox.setRank(GROUP_ID, userId, targetRankNum);

        // 6. Discord Webhook Gönder
        if (DISCORD_WEBHOOK_URL) {
            const embedData = {
                username: "VTN Rütbe Log Sistemi",
                embeds: [{
                    title: "🛡️ Grup Rütbesi Değiştirildi",
                    color: 3066993, // Yeşil
                    fields: [
                        { name: "👤 İşlemi Yapan Yetkili", value: String(adminName || "Bilinmiyor"), inline: true },
                        { name: "🎯 Hedef Oyuncu", value: String(playerName), inline: true },
                        { name: "\u200B", value: "\u200B", inline: false },
                        { name: "🔴 Eski Rütbe", value: String(oldRole), inline: true },
                        { name: "🟢 Yeni Rütbe", value: String(newRole), inline: true }
                    ],
                    timestamp: new Date().toISOString()
                }]
            };

            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embedData)
            });
        }

        res.send("Basarili");
    } catch (e) {
        console.error("Rütbe değiştirme hatası:", e.message);
        res.status(500).send(e.message);
    }
});

app.listen(process.env.PORT || 3000);
