import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { name, phone, brand, message } = req.body;

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "ccanerr936590@gmail.com",
      subject: "Yeni İletişim Formu Talebi",
      html: `
        <h2>Yeni Talep</h2>
        <p><strong>Ad Soyad:</strong> ${name}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        <p><strong>Marka:</strong> ${brand || "-"}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${message}</p>
      `
    });

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Mail gönderilemedi"
    });
  }
}