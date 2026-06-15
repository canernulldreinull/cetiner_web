const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const https = require("https");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();

// --- 1. MİDDLEWARE VE GÜVENLİK AYARLARI ---
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json()); // Gelen form verilerini (JSON) okuyabilmek için şart

app.use(cors({
  origin: "*", // Canlıya geçince buraya sadece kendi site linkini yazabilirsin
  methods: ["POST"],
  allowedHeaders: ["Content-Type"]
}));

// --- 2. SUPABASE BAĞLANTI AYARI ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- 3. GÜVENLİK: RATE LİMİTER (Spam Engelleme) ---
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Dakika
  max: 5, // Bir IP 15 dakikada en fazla 5 form gönderebilir
  message: { success: false, error: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." }
});

// --- 4. NODEMAİLER (E-posta Gönderim Ayarı) ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --- 5. ANA FORM ROTASI (POST /api/contact) ---
app.post("/api/contact", contactLimiter, async (req, res) => {
  const { name, phone, brand, message } = req.body;

  // Temel veri kontrolü
  if (!name || !phone || !brand) {
    return res.status(400).json({ success: false, error: "Lütfen zorunlu alanları doldurun." });
  }

  try {
    // A. VERİ TABANINA KAYDET (Supabase)
    const { error: supabaseError } = await supabase
      .from("leads")
      .insert([{ name, phone, brand, message }]);

    if (supabaseError) {
      console.error("Supabase Hatası:", supabaseError);
      throw new Error("Veri tabanına kaydedilemedi.");
    }

    // B. E-POSTA BİLDİRİMİ GÖNDER
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Bildirim kendine geleceği için alıcı da sensin
      subject: `🚀 Yeni Müşteri Talebi: ${brand}`,
      text: `Siteden Yeni Form Geldi!\n\nİsim: ${name}\nTelefon: ${phone}\nFirma/Sektör: ${brand}\nMesaj: ${message}`
    };
    await transporter.sendMail(mailOptions);

    // C. DİSCORD WEBHOOK BİLDİRİMİ (Eğer .env dosmanda link varsa çalışır)
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

    // Her şey başarılıysa frontend'e güzel haberi uçur
    return res.status(200).json({ success: true, message: "Talebiniz başarıyla alındı!" });

  } catch (error) {
    console.error("Sistem Hatası:", error);
    return res.status(500).json({ success: false, error: "Form işlenirken bir hata oluştu." });
  }
});

// --- 6. SUNUCUYU BAŞLATMA (Her Zaman En Altta Olmalı) ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Çetiner Web Engine Active On Port: ${PORT}`);
  console.log(`=========================================`);
});