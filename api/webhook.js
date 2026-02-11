const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = "-1003658290440"; // ID Channel Mas Ecky

module.exports = async (req, res) => {
    // Pastikan hanya menerima POST request
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const body = req.body;

    // --- 1. HANDLING INPUT DARI FORM (MINI APP) ---
    if (body.type === "SUBMIT_FORM") {
        try {
            // KIRIM SELURUH formData KE GAS
            const gasRes = await axios.post(process.env.APPS_SCRIPT_URL, body.formData);
            const { uniqueId, nama } = gasRes.data;

            if (!uniqueId) throw new Error("GAS tidak kirim ID");

            // Siapkan Media Group (Album) untuk dikirim ke Channel
            const media = [];
return res.status(200).json({ status: "success", uniqueId, nama });
            // Jika ada foto KM Awal (Khusus KBM)
            if (body.formData.fileKmAwal) {
                media.push({ 
                    type: 'photo', 
                    media: { source: Buffer.from(body.formData.fileKmAwal, 'base64') } 
                });
            }

            // Jika ada foto KM Akhir (Khusus KBM)
            if (body.formData.fileKmAkhir) {
                media.push({ 
                    type: 'photo', 
                    media: { source: Buffer.from(body.formData.fileKmAkhir, 'base64') } 
                });
            }

            // Foto Evidence/Nota (Wajib ada) - Kita tempelkan Caption di sini
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

            // Kirim Album ke Channel
            await bot.telegram.sendMediaGroup(CHANNEL_ID, media);

            // Kirim balik respon sukses ke Frontend
            return res.status(200).json({ status: "success", uniqueId });

        } catch (error) {
            console.error("Error SUBMIT_FORM:", error);
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    // --- 2. HANDLING CHAT TELEGRAM BIASA (BOT) ---
    try {
        if (body.message) {
            const chatId = body.message.chat.id;

            // Menangkap data dari tg.sendData() di index.html
            // Ini yang bikin teknisi dapet chat berisi ID setelah form ditutup
            if (body.message.web_app_data) {
                const resultData = JSON.parse(body.message.web_app_data.data);
                await bot.telegram.sendMessage(chatId, resultData.message, { 
                    parse_mode: 'Markdown' 
                });
                return res.status(200).send('OK');
            }

            // Command /start (Cadangan jika tombol menu tidak muncul)
            if (body.message.text === '/start') {
                await bot.telegram.sendMessage(chatId, "Selamat datang! Silakan klik tombol di bawah untuk input laporan panjer.", {
                    reply_markup: {
                        inline_keyboard: [[
                            { 
                                text: "📝 Input Panjer", 
                                web_app: { url: `https://${process.env.VERCEL_URL}/` } 
                            }
                        ]]
                    }
                });
                return res.status(200).send('OK');
            }
        }

        // Kirim 200 OK ke Telegram agar tidak dikirim ulang (looping)
        return res.status(200).send('OK');

    } catch (err) {
        console.error("Error Webhook General:", err);
        return res.status(200).send('OK');
    }
};
