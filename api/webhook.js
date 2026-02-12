const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = "-1003658290440";

const handler = async (req, res) => {
    // Hanya menerima metode POST
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    const body = req.body;

    // Logika ketika form dari Mini App disubmit
    if (body.type === "SUBMIT_FORM") {
        try {
            const { formData } = body;
            
            // 1. GENERATE ID UNIK (Format: 02-W2-582)
            const d = new Date();
            const bulan = ("0" + (d.getMonth() + 1)).slice(-2);
            const mingguKe = Math.ceil(d.getDate() / 7);
            const random3 = Math.floor(100 + Math.random() * 900);
            const uniqueId = `${bulan}-W${mingguKe}-${random3}`;

            // 2. CEK IZIN & KIRIM KE GAS DULU
            // Vercel bertanya ke GAS: "ID ini ada di db_teknisi gak? Kalau ada, siapa namanya?"
            const gasRes = await axios.post(process.env.APPS_SCRIPT_URL, { ...formData, uniqueId });
            
            // Jika status dari GAS adalah 'unauthorized' (tidak terdaftar)
            if (gasRes.data.status === "unauthorized") {
                await bot.telegram.sendMessage(formData.telegramId, `🚫 *AKSES DITOLAK*\n\nMaaf Mas, ID Telegram Anda (\`${formData.telegramId}\`) belum terdaftar di database teknisi. Silakan hubungi Mas Ecky.`);
                return res.status(403).json({ status: "unauthorized", message: "ID tidak terdaftar" });
            }

            const namaFix = gasRes.data.namaAsli || "Teknisi";

            // 3. SIAPKAN MEDIA GROUP (ALBUM FOTO)
            const media = [];
            const addPhoto = (base64) => {
                if (base64) {
                    media.push({ 
                        type: 'photo', 
                        media: { source: Buffer.from(base64, 'base64') } 
                    });
                }
            };

            // Masukkan foto secara berurutan ke album
            addPhoto(formData.fileKmAwal);
            addPhoto(formData.fileKmAkhir);
            addPhoto(formData.fileNota);

            // 4. SUSUN CAPTION (Hanya muncul jika diisi)
            let caption = `📌 *LAPORAN PANJER BARU*\n`;
            caption += `--------------------------\n`;
            caption += `🆔 ID: \`${uniqueId}\`\n`;
            caption += `👤 Teknisi: ${namaFix}\n`;
            caption += `🚗 Jenis: ${formData.jenis}\n`;
            
            if (formData.tim) caption += `👥 TIM: ${formData.tim}\n`;
            if (formData.plat) caption += `🚘 PLAT: ${formData.plat}\n`;
            if (formData.kmAwal) caption += `🛣️ KM: ${formData.kmAwal} s/d ${formData.kmAkhir}\n`;
            
            caption += `📝 Uraian: ${formData.uraian}\n`;
            caption += `💰 Jumlah: Rp ${Number(formData.jumlah).toLocaleString('id-ID')}\n`;
            caption += `--------------------------\n`;
            caption += `✅ Tercatat di Spreadsheet`;

            // Foto terakhir (Evidence) sebagai pembawa caption
            media.push({ 
                type: 'photo', 
                media: { source: Buffer.from(formData.fileEvidence, 'base64') }, 
                caption: caption, 
                parse_mode: 'Markdown' 
            });

            // 5. KIRIM KE TELEGRAM (Channel & Chat Pribadi)
            await bot.telegram.sendMediaGroup(CHANNEL_ID, media);
            
            await bot.telegram.sendMessage(formData.telegramId, `✅ *Laporan Berhasil!*\n\nID: \`${uniqueId}\`\nNama: ${namaFix}\n\nLaporan sudah masuk ke Channel dan Spreadsheet.`, { parse_mode: 'Markdown' });

            return res.status(200).json({ status: "success", uniqueId });

        } catch (error) {
            console.error("Detail Error:", error.message);
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    // Handle pesan biasa atau perintah /start
    if (body.message && body.message.text === '/start') {
        const welcomeMsg = `Halo Mas! 👋\n\nID Telegram Anda: \`${body.message.from.id}\`\n\nPastikan ID ini sudah didaftarkan Mas Ecky ke database supaya bisa kirim laporan.`;
        await bot.telegram.sendMessage(body.message.chat.id, welcomeMsg, { parse_mode: 'Markdown' });
    }

    return res.status(200).send('OK');
};

// Ekspor handler dan konfigurasi limit besar
module.exports = handler;
module.exports.config = {
    api: {
        bodyParser: {
            sizeLimit: '15mb', // Supaya kuat kirim 4 foto sekaligus
        },
    },
};
