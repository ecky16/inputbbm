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
    const uniqueId = `OSA-${d.getFullYear()}-${d.getHours()}${d.getMinutes()}${d.getSeconds()}`;

    // A. Lapor ke GAS dulu untuk ambil Nama Asli dari DB
    const gasRes = await axios.post(process.env.APPS_SCRIPT_URL, { ...formData, uniqueId });
    const namaFix = gasRes.data.namaAsli || "Tidak Dikenal";

    // B. Siapkan Media Group (Gunakan namaFix)
    const media = [];
    if (formData.fileKmAwal) media.push({ type: 'photo', media: { source: Buffer.from(formData.fileKmAwal, 'base64') } });
    if (formData.fileKmAkhir) media.push({ type: 'photo', media: { source: Buffer.from(formData.fileKmAkhir, 'base64') } });

    const caption = `📌 *LAPORAN PANJER BARU*\n--------------------------\n🆔 ID: \`${uniqueId}\`\n👤 Teknisi: ${namaFix}\n🚗 Jenis: ${formData.jenis}\n📝 Uraian: ${formData.uraian}\n💰 Jumlah: Rp ${Number(formData.jumlah).toLocaleString('id-ID')}`;
    
    media.push({ type: 'photo', media: { source: Buffer.from(formData.fileEvidence, 'base64') }, caption, parse_mode: 'Markdown' });

    // C. Kirim ke Channel & Chatbot
    await bot.telegram.sendMediaGroup(CHANNEL_ID, media);
    await bot.telegram.sendMessage(formData.telegramId, `✅ *Laporan Berhasil!*\n\nID: \`${uniqueId}\`\nNama: ${namaFix}`, { parse_mode: 'Markdown' });

    return res.status(200).json({ status: "success", uniqueId });
} catch (error) { ... }

            // --- BAGIAN KRUSIAL: Kita pakai await satu-satu biar Vercel gak mati duluan ---
            
            // A. Kirim ke Channel
            await bot.telegram.sendMediaGroup(CHANNEL_ID, media);
            
            // B. Kirim ke Google Sheets (GAS)
            // Kita kirim nama dan uniqueId agar GAS tinggal catat
            await axios.post(process.env.APPS_SCRIPT_URL, { ...formData, uniqueId });

            // C. Kirim ke Chat Pribadi Teknisi
            await bot.telegram.sendMessage(formData.telegramId, `✅ *Laporan Berhasil!*\n\nID: \`${uniqueId}\`\nData telah terinput ke Spreadsheet dan Channel.`, { parse_mode: 'Markdown' });

            // 3. Setelah SEMUA selesai, baru kasih respon ke Mini App
            return res.status(200).json({ status: "success", uniqueId });

        } catch (error) {
            console.error("Detail Error:", error.message);
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    // Untuk handle /start
    if (body.message && body.message.text === '/start') {
        await bot.telegram.sendMessage(body.message.chat.id, "Silakan gunakan tombol menu untuk input laporan.");
    }
    return res.status(200).send('OK');
};

module.exports = handler;
module.exports.config = { api: { bodyParser: { sizeLimit: '10mb' } } };
