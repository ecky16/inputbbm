

const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
// Ganti yang tadinya manual jadi pakai process.env
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;// GANTI INI
const CHANNEL_ID = "-1003658290440";

module.exports = async (req, res) => {
  try {
    const { body } = req;

    // 1. LOGIKA UNTUK DATA DARI MINI APP (SUBMIT FORM)
    if (body.type === "SUBMIT_FORM") {
      // Kirim data ke Google Apps Script
      const response = await axios.post(APPS_SCRIPT_URL, body.formData);
      const resData = response.data; // Dapat uniqueId, nama, nik dari GS

      if (resData.status === "success") {
        // Susun Caption untuk ke Channel
        const caption = `📌 *LAPORAN PANJER BARU*\n` +
                        `--------------------------\n` +
                        `🆔 ID: \`${resData.uniqueId}\`\n` +
                        `👤 Teknisi: *${resData.nama}* (${resData.nik})\n` +
                        `🚗 Jenis: ${body.formData.jenis}\n` +
                        `📝 Uraian: ${body.formData.uraian}\n` +
                        `💰 Jumlah: Rp ${Number(body.formData.jumlah).toLocaleString('id-ID')}\n` +
                        `--------------------------\n` +
                        `✅ Tercatat di Sheet Kolom N`;

        // Kirim ke Channel
        await bot.telegram.sendMessage(CHANNEL_ID, caption, { parse_mode: 'Markdown' });
        
        // Kirim respon balik ke HTML (Mini App)
        return res.status(200).json(resData);
      }
    }

    // 2. LOGIKA UNTUK CHAT BIASA (MISAL /START)
    if (body.message) {
      if (body.message.text === '/start') {
        await bot.telegram.sendMessage(body.message.chat.id, "Halo Mas Ecky! Klik tombol di bawah untuk lapor panjer:", {
          reply_markup: {
            inline_keyboard: [[
              { text: "Buka Form Input", web_app: { url: `https://${process.env.VERCEL_URL}/` } }
            ]]
          }
        });
      } else {
        await bot.handleUpdate(body);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error("Error Webhook:", error);
    res.status(500).send('Error');
  }
};
