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
            
            // 1. GENERATE ID BARU: MM-WX-RANDOM (Contoh: 02-W2-582)
            const d = new Date();
            const bulan = ("0" + (d.getMonth() + 1)).slice(-2);
            const mingguKe = Math.ceil(d.getDate() / 7);
            const random3 = Math.floor(100 + Math.random() * 900);
            const uniqueId = `${bulan}-W${mingguKe}-${random3}`;

            // 2. KIRIM KE GAS DULU (Ambil Nama Asli & Simpan ke Sheet)
            const gasRes = await axios.post(process.env.APPS_SCRIPT_URL, { ...formData, uniqueId });
            const namaFix = gasRes.data.namaAsli || "Tidak Dikenal";

            // 3. SIAPKAN MEDIA GROUP (Maksimal 4 Foto)
            const media = [];
            const addPhoto = (base64) => {
                if (base64) media.push({ 
                    type: 'photo', 
                    media: { source: Buffer.from(base64, 'base64') } 
                });
            };

            addPhoto(formData.fileKmAwal);
            addPhoto(formData.fileKmAkhir);
            addPhoto(formData.fileNota); // Foto Nota masuk ke urutan album

            // Susun Caption agar rapi dan tidak ada tanda "-" atau "0"
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

            // Foto Terakhir (Evidence) dengan Caption
            media.push({ 
                type: 'photo', 
                media: { source: Buffer.from(formData.fileEvidence, 'base64') }, 
                caption: caption, 
                parse_mode: 'Markdown' 
            });

            // 4. EKSEKUSI KIRIM KE TELEGRAM
            await bot.telegram.sendMediaGroup(CHANNEL_ID, media);
            
            // Kirim notifikasi ID ke chat pribadi teknisi agar bisa di-copy
            await bot.telegram.sendMessage(formData.telegramId, `✅ *Laporan Berhasil!*\n\nID: \`${uniqueId}\`\nNama: ${namaFix}\n\nData telah terinput ke Spreadsheet dan Channel.`, { parse_mode: 'Markdown' });

            return res.status(200).json({ status: "success", uniqueId });

        } catch (error) {
            console.error("Detail Error:", error.message);
            return res.status(500).json({ status: "error", message: error.message });
        }
    }

    if (body.message && body.message.text === '/start') {
        await bot.telegram.sendMessage(body.message.chat.id, "Halo Mas! Silakan gunakan tombol menu untuk input laporan.");
    }
    return res.status(200).send('OK');
};

module.exports = handler;
module.exports.config = { 
    api: { 
        bodyParser: { 
            sizeLimit: '15mb' // Naikkan ke 15mb karena sekarang ada 4 foto
        } 
    } 
};
