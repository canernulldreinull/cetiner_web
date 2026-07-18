import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // CORS başlıkları
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

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: "Ad ve telefon alanları zorunludur."
      });
    }

    // 1. SUPABASE'E KAYIT
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase ENV bilgileri eksik!", {
        hasUrl: Boolean(supabaseUrl),
        hasKey: Boolean(supabaseAnonKey)
      });

      return res.status(500).json({
        success: false,
        error: "Supabase bağlantı bilgileri eksik."
      });
    }

    if (
      !supabaseUrl.startsWith("https://") ||
      !supabaseUrl.includes(".supabase.co")
    ) {
      console.error("Geçersiz Supabase URL:", supabaseUrl);

      return res.status(500).json({
        success: false,
        error: "Supabase URL hatalı."
      });
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });

      const { error: supabaseError } = await supabase
        .from("leads")
        .insert([
          {
            name,
            phone,
            brand: brand || null,
            message: message || null
          }
        ]);

      if (supabaseError) {
        console.error("Supabase insert hatası:", {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code
        });

        return res.status(400).json({
          success: false,
          error: `Supabase: ${supabaseError.message}`
        });
      }
    } catch (supabaseFetchError) {
      console.error("Supabase bağlantı hatası:", {
        message: supabaseFetchError?.message,
        cause: supabaseFetchError?.cause,
        stack: supabaseFetchError?.stack,
        url: supabaseUrl
      });

      return res.status(502).json({
        success: false,
        error: "Supabase sunucusuna bağlanılamadı."
      });
    }

    // 2. RESEND İLE E-POSTA GÖNDERİMİ
    const resendApiKey = process.env.RESEND_API_KEY?.trim();

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      const { data: emailData, error: emailError } =
        await resend.emails.send({
          from: "Portföy Formu <onboarding@resend.dev>",
          to: ["ccanerr936590@gmail.com"],
          subject: `Yeni İletişim Formu Talebi: ${
            brand || "Belirtilmedi"
          }`,
          html: `
            <h2>Yeni Müşteri Talebi</h2>
            <p><strong>Ad Soyad:</strong> ${name}</p>
            <p><strong>Telefon:</strong> ${phone}</p>
            <p><strong>Marka/İşletme:</strong> ${brand || "-"}</p>
            <p><strong>Mesaj:</strong> ${message || "-"}</p>
          `
        });

      if (emailError) {
        console.error("Resend hatası:", emailError);

        return res.status(502).json({
          success: false,
          error: `E-posta gönderilemedi: ${emailError.message}`
        });
      }

      console.log("E-posta gönderildi:", emailData?.id);
    } else {
      console.warn("RESEND_API_KEY bulunamadı.");
    }

    return res.status(200).json({
      success: true,
      message: "Talebiniz başarıyla alındı."
    });
  } catch (error) {
    console.error("Sistem hatası:", {
      message: error?.message,
      cause: error?.cause,
      stack: error?.stack
    });

    return res.status(500).json({
      success: false,
      error: error?.message || "Bilinmeyen sistem hatası."
    });
  }
}