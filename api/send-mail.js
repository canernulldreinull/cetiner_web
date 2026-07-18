import { Resend } from "resend";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed"
    });
  }

  try {
    const { name, phone, brand, message } = req.body || {};

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Ad ve telefon alanları zorunludur."
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY?.trim();

    if (!resendApiKey) {
      return res.status(500).json({
        success: false,
        error: "RESEND_API_KEY bulunamadı."
      });
    }

    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: "Portföy Formu <onboarding@resend.dev>",
      to: ["ccanerr936590@gmail.com"],
      subject: `Yeni İletişim Formu Talebi: ${
        brand?.trim() || "Belirtilmedi"
      }`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Yeni Müşteri Talebi</h2>

          <p>
            <strong>Ad Soyad:</strong><br>
            ${escapeHtml(name)}
          </p>

          <p>
            <strong>Telefon:</strong><br>
            ${escapeHtml(phone)}
          </p>

          <p>
            <strong>Marka / İşletme:</strong><br>
            ${escapeHtml(brand || "-")}
          </p>

          <p>
            <strong>Mesaj:</strong><br>
            ${escapeHtml(message || "-")}
          </p>
        </div>
      `
    });

    if (error) {
      console.error("Resend hatası:", error);

      return res.status(error.statusCode || 400).json({
        success: false,
        error: `Resend: ${error.message}`
      });
    }

    console.log("E-posta gönderildi:", data?.id);

    return res.status(200).json({
      success: true,
      message: "Talebiniz başarıyla gönderildi."
    });
  } catch (error) {
    console.error("Sistem hatası:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "E-posta gönderilemedi."
    });
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}