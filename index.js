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

        const userId = await noblox.getIdFromUsername(playerName);
        
        // Değişimden önceki eski rol adını alıyoruz
        let oldRole = "Bilinmiyor";
        try {
            oldRole = await noblox.getRoleInGroup(GROUP_ID, userId);
        } catch(err) {}

        // Rütbeyi güncelliyoruz (setRole çakışmaları önler)
        await noblox.setRole(GROUP_ID, userId, Number(newRank));

        // Değişimden sonraki yeni rol adını alıyoruz
        let newRole = "Bilinmiyor";
        try {
            newRole = await noblox.getRoleInGroup(GROUP_ID, userId);
        } catch(err) {}

        // Discord Webhook Bildirimi Gönderme
        if (DISCORD_WEBHOOK_URL) {
            const embedData = {
                username: "VTN Rütbe Log Sistemi",
                embeds: [{
                    title: "🛡️ Grup Rütbesi Değiştirildi",
                    color: 3066993, // Yeşil renk
                    fields: [
                        { name: "👤 İşlemi Yapan Yetkili", value: adminName || "Bilinmiyor", inline: true },
                        { name: "🎯 Hedef Oyuncu", value: playerName, inline: true },
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
