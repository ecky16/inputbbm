const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = "-1003658290440";

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const body = req.body;

    // Logika jika datang dari Form Mini App
    if (body.type === "SUBMIT_FORM") {
        try {
            // 1. Kirim ke Google Sheets lewat Apps Script
            const gasRes = await axios.post(process.env.APPS_SCRIPT_URL, body.formData);
            const { uniqueId } = gasRes.data;

            // 2. Siapkan Album Foto untuk Channel
            const media = [];
            if (body.formData.fileKmAwal) {
                media.push({ type: 'photo', media: { source: Buffer.from(body.formData.fileKmAwal, 'base64') } });
            }
            if (body.formData.fileKmAkhir) {
                media.push({ type: 'photo', media: { source: Buffer.from(body.formData.fileKmAkhir, 'base64') } });
            }
            
            // Format Caption Mas Ecky
            const caption = `📌 *LAPORAN PANJER BARU*
--------------------------
🆔 ID: \`${uniqueId}\`
👤 Teknisi: ${body.formData.nama} (${body.formData.telegramId})
🚗 Jenis: ${body.formData.jenis}
📝 Uraian: ${body.formData.uraian}
💰 Jumlah: Rp ${Number(body.formData.jumlah).toLocaleString('id-ID')}
--------------------------
✅ Tercatat di Sheet Kolom N`;

            media.push({ 
                type: 'photo', 
                media: { source: Buffer.from(body.formData.fileEvidence, 'base64') },
                caption: caption,
                parse_mode: 'Markdown'
            });

            // 3. Kirim ke Channel
            await bot.telegram.sendMediaGroup(CHANNEL_ID, media);

            return res.status(200).json({ status: "success", uniqueId });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: "error" });
        }
    }

    // Logika Webhook Telegram Biasa (untuk handle /start dan sendData)
    try {
        if (body.message) {
            // Jika teknisi selesai input, bot kirim pesan konfirmasi di chat pribadi
            if (body.message.web_app_data) {
                const data = JSON.parse(body.message.web_app_data.data);
                await bot.telegram.sendMessage(body.message.chat.id, data.message, { parse_mode: 'Markdown' });
            } 
            else if (body.message.text === '/start') {
                await bot.telegram.sendMessage(body.message.chat.id, "Klik tombol di bawah untuk input panjer:", {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: "📝 Input Panjer", web_app: { url: `https://${process.env.VERCEL_URL}/` } }
                        ]]
                    }
                });
            }
        }
        res.status(200).send('OK');
    } catch (e) {
        res.status(200).send('OK');
    }
};
