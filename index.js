const express = require('express');
const noblox = require('noblox.js');
const app = express();
app.use(express.json());
const GROUP_ID = 34143364;
const COOKIE = process.env.ROBLOSECURITY;
noblox.setCookie(COOKIE).then(() => console.log("Giris yapildi!")).catch(console.error);
app.post('/changerank', async (req, res) => {
    try {
        const userId = await noblox.getIdFromUsername(req.body.playerName);
        await noblox.setRank(GROUP_ID, userId, req.body.newRank);
        res.send("Basarili");
    } catch (e) { res.status(500).send(e.message); }
});
app.listen(process.env.PORT || 3000);
