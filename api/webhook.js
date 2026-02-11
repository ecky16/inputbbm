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
            // 1. Generate ID Instan di Vercel biar cepet (Contoh: OSA-2104-55)
            const d = new Date();
            const timestamp = `${d.getHours()}${d.getMinutes()}${d.getSeconds()}`;
            const uniqueId = `OSA-${d.getFullYear()}-${timestamp}`;

            // 2. Kirim ke Channel & GAS secara PARALEL (Gak pake antri)
            const media = [];
            if (formData.fileKmAwal) media.push({ type: 'photo', media: { source: Buffer.from(formData.fileKmAwal, 'base64') } });
            if (formData.fileKmAkhir) media.push({ type: 'photo', media: { source: Buffer.from(formData.fileKmAkhir, 'base64') } });
            
            const caption = `📌 *LAPORAN PANJER BARU*\n--------------------------\n🆔 ID: \`${uniqueId}\`\n👤 Teknisi: ${formData.nama}\n🚗 Jenis: ${formData.jenis}\n📝 Uraian: ${formData.uraian}\n💰 Jumlah: Rp ${Number(formData.jumlah).toLocaleString('id-ID')}`;
            
            media.push({ type: 'photo', media: { source: Buffer.from(formData.fileEvidence, 'base64') }, caption, parse_mode: 'Markdown' });

            // Jalankan semua tugas barengan
            Promise.all([
                bot.telegram.sendMediaGroup(CHANNEL_ID, media),
                axios.post(process.env.APPS_SCRIPT_URL, { ...formData, uniqueId }), // Kirim ID yang sudah jadi ke GAS
                bot.telegram.sendMessage(formData.telegramId, `✅ *Laporan Terkirim!*\nID: \`${uniqueId}\`\n\nID sudah tersimpan di sistem.`, { parse_mode: 'Markdown' })
            ]).catch(e => console.error("Background Task Error:", e));

            // LANGSUNG BALAS KE FRONTEND (Gak nunggu proses di atas selesai)
            return res.status(200).json({ status: "success", uniqueId });

        } catch (error) {
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    if (body.message && body.message.text === '/start') {
        await bot.telegram.sendMessage(body.message.chat.id, "Silakan klik tombol menu untuk input laporan.");
    }
    return res.status(200).send('OK');
};

module.exports = handler;
module.exports.config = { api: { bodyParser: { sizeLimit: '10mb' } } };
