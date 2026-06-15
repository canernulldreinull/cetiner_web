const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  // CORS Ayarları
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // 🟢 Bağlantıyı ve Env Kontrolünü Burada Yapıyoruz (Vercel Standartı)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ success: false, error: "Supabase ENV bilgileri eksik!" });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { name, phone, brand, message } = req.body;

  try {
    // 1. SUPABASE'E KAYIT
    const { error: supabaseError } = await supabase
      .from("leads")
      .insert([{ name, phone, brand, message }]);

    if (supabaseError) {
      return res.status(400).json({ success: false, error: supabaseError.message });
    }

    // 2. MAİL GÖNDERİMİ
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `🚀 Yeni Müşteri Talebi: ${brand}`,
      text: `İsim: ${name}\nTelefon: ${phone}\nMarka: ${brand}\nMesaj: ${message}`
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: "Talebiniz alındı." });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};