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

        // Grubun tüm rol listesini çekiyoruz (Yedek kontrol için)
        let groupRoles = [];
        try {
            groupRoles = await noblox.getRoles(GROUP_ID);
        } catch(e) {}

        // Değişim öncesi eski rol adını öğreniyoruz
        let oldRole = "Bilinmiyor";
        try {
            oldRole = await noblox.getRoleInGroup(GROUP_ID, userId);
        } catch(err) {}

        // Rütbeyi değiştiriyoruz
        const rankResult = await noblox.setRank(GROUP_ID, userId, Number(newRank));

        // Yeni ve eski rol adlarını doğrula
        let newRole = "Bilinmiyor";

        // 1. Yol: setRank fonksiyonunun kendi çıktısından rol adlarını al
        if (rankResult && rankResult.newRole && rankResult.newRole.name) {
            newRole = rankResult.newRole.name;
            if (rankResult.oldRole && rankResult.oldRole.name) {
                oldRole = rankResult.oldRole.name;
            }
        } else if (rankResult && rankResult.name) {
            newRole = rankResult.name;
        }

        // 2. Yol: Eğer hala Bilinmiyor ise gruptaki rol listesinden yeni rütbe ID'sine göre adını bul
        if (newRole === "Bilinmiyor" && groupRoles.length > 0) {
            const found = groupRoles.find(r => r.rank === Number(newRank) || r.id === Number(newRank));
            if (found) newRole = found.name;
        }

        // 3. Yol: Son çare tekrar getir
        if (newRole === "Bilinmiyor") {
            try {
                newRole = await noblox.getRoleInGroup(GROUP_ID, userId);
            } catch(e) {}
        }

        // Discord Webhook Bildirimi
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
