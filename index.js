const express = require('express');
const noblox = require('noblox.js');
const app = express();

app.use(express.json());

const GROUP_ID = 34143364;
const COOKIE = process.env.ROBLOSECURITY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

noblox.setCookie(COOKIE, false).then(() => {
    console.log("Bot hazir!");
}).catch((err) => {
    console.error("Giris hatasi:", err.message);
});

app.post('/changerank', async (req, res) => {
    try {
        const { adminName, playerName, newRank } = req.body;
        console.log(`[ISTEK] Yetkili: ${adminName} | Hedef: ${playerName} | Yeni Rank: ${newRank}`);

        // 1. Oyuncunun ID'sini al
        const userId = await noblox.getIdFromUsername(playerName);

        // 2. Rütbeyi değiştir (Bu işlem eski ve yeni rol isimlerini otomatik döndürür)
        const rankResult = await noblox.setRank(GROUP_ID, userId, Number(newRank));
        console.log("[SONUC]:", rankResult);

        // Rol isimlerini güvenli şekilde al
        const oldRole = (rankResult && rankResult.oldRole && rankResult.oldRole.name) 
            ? rankResult.oldRole.name 
            : "Bilinmiyor";

        const newRole = (rankResult && rankResult.newRole && rankResult.newRole.name) 
            ? rankResult.newRole.name 
            : "Bilinmiyor";

        // 3. Discord Webhook Gönderimi
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
        console.error("[HATA]:", e.message);
        res.status(500).send(e.message);
    }
});

app.listen(process.env.PORT || 3000);
