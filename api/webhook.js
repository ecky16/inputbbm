const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyZ9iNgAtS6Vp3ATSRvGZuNFVL_BTHRcLvnGhIbraeulIvR8K57MohgJ4CX3erHO51F/exec";
const CHANNEL_ID = "-1003658290440";

// Handle perintah /start
bot.start((ctx) => {
  ctx.reply('Halo Mas! Klik tombol di bawah untuk input panjer.', {
    reply_markup: {
      inline_keyboard: [[
        { text: "Buka Form Input", web_app: { url: `https://${process.env.VERCEL_URL}/index.html` } }
      ]]
    }
  });
});

// Webhook Handler
module.exports = async (req, res) => {
  try {
    const { body } = req;
    
    // Jika ada request masuk dari Bot (Chat biasa)
    if (body.message || body.callback_query) {
      await bot.handleUpdate(body);
    } 
    
    // Jika ada request masuk dari Mini App (Custom request)
    // Mas bisa panggil ini dari fetch() di index.html tadi
    if (body.type === "SUBMIT_FORM") {
      // 1. Kirim ke Google Sheets
      const response = await axios.post(APPS_SCRIPT_URL, body.formData);
      const resData = response.data;

      // 2. Kirim Notif ke Channel
      const caption = `✅ *LAPORAN PANJER BARU*\n` +
                      `--------------------------\n` +
                      `🆔 ID: \`${resData.uniqueId}\`\n` +
                      `👤 Teknisi: *${resData.nama}*\n` +
                      `🚗 Jenis: ${body.formData.jenis}\n` +
                      `💰 Jumlah: Rp ${Number(body.formData.jumlah).toLocaleString('id-ID')}\n` +
                      `--------------------------\n` +
                      `Cek detail di Google Sheets (Kolom N)`;

      await bot.telegram.sendMessage(CHANNEL_ID, caption, { parse_mode: 'Markdown' });
      
      return res.status(200).json(resData);
    }

    res.status(200).send('OK');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error');
  }
};
