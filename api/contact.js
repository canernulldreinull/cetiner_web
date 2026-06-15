const nodemailer = require("nodemailer");
const https = require("https");
const { createClient } = require("@supabase/supabase-js");

// Supabase Bağlantısı
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Nodemailer Bağlantısı
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Vercel'in resmi istek yakalayıcı fonksiyonu (Express yerine bu kullanılır)
module.exports = async (req, res) => {
  // CORS Başlıkları (Frontend'in bağlanabilmesi için şart)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Eğer tarayıcı kontrol isteği (OPTIONS) atarsa boş dön
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Sadece POST isteklerini kabul et
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const { name, phone, brand, message } = req.body;

  if (!name || !phone || !brand) {
    return res.status(400).json({ success: false, error: "Lütfen zorunlu alanları doldurun." });
  }

  try {
    // 1. SUPABASE'E KAYDET
    const { error: supabaseError } = await supabase
      .from("leads")
      .insert([{ name, phone, brand, message }]);

    if (supabaseError) {
      console.error("Supabase Hatası:", supabaseError);
      throw new Error("Veri tabanına kaydedilemedi.");
    }

    // 2. GMAİL BİLDİRİMİ GÖNDER
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `🚀 Yeni Müşteri Talebi: ${brand}`,
      text: `Siteden Yeni Form Geldi!\n\nİsim: ${name}\nTelefon: ${phone}\nFirma/Sektör: ${brand}\nMesaj: ${message}`
    };
    await transporter.sendMail(mailOptions);

    // 3. DİSCORD BİLDİRİMİ GÖNDER (Varsa)
    if (process.env.DISCORD_WEBHOOK_URL) {
      const discordData = JSON.stringify({
        content: `🔥 **Yeni Müşteri Talebi Düştü!**\n**İsim:** ${name}\n**Telefon:** ${phone}\n**Marka:** ${brand}\n**Mesaj:** ${message}`
      });

      const discordUrl = new URL(process.env.DISCORD_WEBHOOK_URL);
      const options = {
        hostname: discordUrl.hostname,
        path: discordUrl.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(discordData)
        }
      };

      const reqDiscord = https.request(options);
      reqDiscord.write(discordData);
      reqDiscord.end();
    }

    // Başarılı sonucu frontend'e dön
    return res.status(200).json({ success: true, message: "Talebiniz başarıyla alındı!" });

  } catch (error) {
    console.error("Sistem Hatası:", error);
    return res.status(500).json({ success: false, error: "Form işlenirken bir hata oluştu." });
  }
};