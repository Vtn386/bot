const express = require('express');
const noblox = require('noblox.js');
const app = express();

app.use(express.json());

const GROUP_ID = 34143364;
const COOKIE = process.env.ROBLOSECURITY;

// 'false' ekleyerek açılıştaki otomatik IP doğrulamasını es geçiyoruz
noblox.setCookie(COOKIE, false).then(() => {
    console.log("Cookie yuklendi (Dogrulama atlandi)!");
}).catch((err) => {
    console.error("Giris hatasi:", err.message);
});

app.post('/changerank', async (req, res) => {
    try {
        const userId = await noblox.getIdFromUsername(req.body.playerName);
        await noblox.setRank(GROUP_ID, userId, req.body.newRank);
        res.send("Basarili");
    } catch (e) {
        res.status(500).send(e.message);
    }
});

app.listen(process.env.PORT || 3000);
