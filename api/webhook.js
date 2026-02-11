const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = "-1003658290440";

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const body = req.body;

    if (body.type === "SUBMIT_FORM") {
        try {
            const gasRes = await axios.post(process.env.APPS_SCRIPT_URL, body.formData);
            const { uniqueId, nama } = gasRes.data;

            const media = [];
            if (body.formData.fileKmAwal) {
                media.push({ type: 'photo', media: { source: Buffer.from(body.formData.fileKmAwal, 'base64') } });
            }
            if (body.formData.fileKmAkhir) {
                media.push({ type: 'photo', media: { source: Buffer.from(body.formData.fileKmAkhir, 'base64') } });
            }

            const caption = `📌 *LAPORAN PANJER BARU*
--------------------------
🆔 ID: \`${uniqueId}\`
👤 Teknisi: ${nama} (${body.formData.telegramId})
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

            await bot.telegram.sendMediaGroup(CHANNEL_ID, media);
            return res.status(200).json({ status: "success", uniqueId });
        } catch (error) {
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    try {
        if (body.message) {
            if (body.message.web_app_data) {
                const data = JSON.parse(body.message.web_app_data.data);
                await bot.telegram.sendMessage(body.message.chat.id, data.message, { parse_mode: 'Markdown' });
            } else if (body.message.text === '/start') {
                await bot.telegram.sendMessage(body.message.chat.id, "Klik tombol menu untuk input panjer.");
            }
        }
        res.status(200).send('OK');
    } catch (e) { res.status(200).send('OK'); }
};
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Naikkan limit ke 10MB biar foto bisa masuk
    },
  },
};
