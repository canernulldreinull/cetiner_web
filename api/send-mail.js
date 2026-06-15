import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Vercel üzerinde env kontrolü ve Supabase başlatma
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  // CORS Başlıkları
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const { name, phone, brand, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, error: "Ad ve Telefon alanları zorunludur." });
    }

    // 🟢 1. SUPABASE'E KAYIT
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error: supabaseError } = await supabase
        .from("leads")
        .insert([{ name, phone, brand, message }]);

      if (supabaseError) {
        console.error("Supabase Hatası:", supabaseError);
        return res.status(400).json({ success: false, error: `Supabase: ${supabaseError.message}` });
      }
    } else {
      console.error("Supabase ENV bilgileri eksik!");
    }

    // 🟢 2. RESEND ILE MAİL GÖNDERİMİ
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "ccanerr936590@gmail.com",
        subject: `🚀 Yeni İletişim Formu Talebi: ${brand || "Belirtilmedi"}`,
        html: `
          <h2>Yeni Müşteri Talebi Düştü</h2>
          <p><strong>Ad Soyad:</strong> ${name}</p>
          <p><strong>Telefon:</strong> ${phone}</p>
          <p><strong>Marka/İşletme:</strong> ${brand || "-"}</p>
          <p><strong>Mesaj:</strong> ${message}</p>
        `
      });
    }

    return res.status(200).json({ success: true, message: "Talebiniz başarıyla alındı." });

  } catch (error) {
    console.error("Sistem Hatası:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}