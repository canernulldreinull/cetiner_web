const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

app.set("trust proxy", 1);

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Çetiner Web API çalışıyor.");
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin."
  }
});

app.post("/send-mail", contactLimiter, async (req, res) => {
  try {
    const { name, phone, brand, message } = req.body;

    if (
      !name ||
      !phone ||
      !message ||
      name.trim().length < 2 ||
      phone.trim().length < 10 ||
      message.trim().length < 10
    ) {
      return res.status(400).json({
        success: false,
        message: "Lütfen tüm alanları doğru şekilde doldurun."
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
  from: `"Çetiner Web Form" <${process.env.MAIL_USER}>`,
  to: process.env.MAIL_TO,
  subject: "Yeni Web Sitesi Teklif Talebi",
  html: `
    <h2>Yeni Teklif Talebi</h2>
    <p><strong>Ad Soyad:</strong> ${name}</p>
    <p><strong>Telefon:</strong> ${phone}</p>
    <p><strong>Marka / İşletme:</strong> ${brand || "Belirtilmedi"}</p>
    <p><strong>Mesaj:</strong> ${message}</p>
  `,
});

console.log("Mail başarıyla gönderildi.");

return res.json({
  success: true,
  message: "Talebiniz alındı."
});

  } catch (error) {
    console.error("Mail gönderme hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Mail gönderilemedi."
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server çalışıyor: ${PORT}`);
});