const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = "-1003658290440";

const handler = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const body = req.body;

    if (body.type === "SUBMIT_FORM") {
        try {
            const { formData } = body;
            const d = new Date();
            const timestamp = `${d.getHours()}${d.getMinutes()}${d.getSeconds()}`;
            const uniqueId = `OSA-${d.getFullYear()}-${timestamp}`;

            // A. KIRIM KE GAS DULU (Untuk ambil Nama Asli dari DB)
            const gasRes = await axios.post(process.env.APPS_SCRIPT_URL, { ...formData, uniqueId });
            const namaFix = gasRes.data.namaAsli || "Tidak Dikenal";

            // B. SIAPKAN MEDIA GROUP UNTUK CHANNEL
            const media = [];
            if (formData.fileKmAwal) {
                media.push({ type: 'photo', media: { source: Buffer.from(formData.fileKmAwal, 'base64') } });
            }
            if (formData.fileKmAkhir) {
                media.push({ type: 'photo', media: { source: Buffer.from(formData.fileKmAkhir, 'base64') } });
            }

            const caption = `📌 *LAPORAN PANJER BARU*
--------------------------
🆔 ID: \`${uniqueId}\`
👤 Teknisi: ${namaFix}
🚗 Jenis: ${formData.jenis}
📝 Uraian: ${formData.uraian}
💰 Jumlah: Rp ${Number(formData.jumlah).toLocaleString('id-ID')}
--------------------------
✅ Tercatat di Spreadsheet`;

            media.push({ 
                type: 'photo', 
                media: { source: Buffer.from(formData.fileEvidence, 'base64') }, 
                caption: caption, 
                parse_mode: 'Markdown' 
            });

            // C. KIRIM KE CHANNEL
            await bot.telegram.sendMediaGroup(CHANNEL_ID, media);

            // D. KIRIM KE CHAT PRIBADI TEKNISI
            await bot.telegram.sendMessage(formData.telegramId, `✅ *Laporan Berhasil!*\n\nID: \`${uniqueId}\`\nNama: ${namaFix}\nData telah terinput ke Spreadsheet dan Channel.`, { parse_mode: 'Markdown' });

            return res.status(200).json({ status: "success", uniqueId });

        } catch (error) {
            console.error("Detail Error:", error.message);
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    if (body.message && body.message.text === '/start') {
        await bot.telegram.sendMessage(body.message.chat.id, "Silakan gunakan tombol menu untuk input laporan.");
    }
    return res.status(200).send('OK');
};

module.exports = handler;
module.exports.config = { api: { bodyParser: { sizeLimit: '10mb' } } };
