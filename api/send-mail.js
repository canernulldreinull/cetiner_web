import { Resend } from "resend";

// Form yalnızca kendi sitemizden (aynı kaynak) gönderilir; CORS başlığı verilmez.
const PRODUCTION_ORIGINS = ["https://cetinerweb.com", "https://www.cetinerweb.com"];

const LIMITS = {
  name: { min: 2, max: 60 },
  brand: { max: 100 },
  message: { min: 10, max: 2000 },
  maxLinks: 2
};

// Bellek içi hız sınırı yalnızca aynı sunucusuz örneğe gelen istekleri görür;
// soğuk başlatmada sıfırlanır ve örnekler arasında paylaşılmaz. Kesin koruma
// için Vercel Firewall kuralı veya harici bir depo (ör. Upstash) gerekir.
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };
const hits = new Map();

const GENERIC_ERROR = "Talebiniz şu anda gönderilemedi. Lütfen daha sonra tekrar deneyin veya WhatsApp'tan yazın.";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  if (!isAllowedOrigin(req.headers.origin)) {
    return res.status(403).json({ success: false, error: "İzin verilmeyen kaynak." });
  }

  if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
    return res.status(415).json({ success: false, error: "Geçersiz istek biçimi." });
  }

  if (isRateLimited(clientIp(req))) {
    res.setHeader("Retry-After", String(RATE_LIMIT.windowMs / 1000));
    return res.status(429).json({
      success: false,
      error: "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin."
    });
  }

  const body = parseBody(req.body);
  if (!body) {
    return res.status(400).json({ success: false, error: "Geçersiz istek biçimi." });
  }

  // Honeypot: gerçek kullanıcılar bu gizli alanı boş bırakır. Botlara başarı
  // döndürülür ki filtrelendiklerini anlamasınlar; e-posta gönderilmez.
  // Alan gönderilmezse (eski önbellekteki form) normal akış sürer.
  if (typeof body.hp_ref === "string" && body.hp_ref.trim() !== "") {
    return res.status(200).json({ success: true, message: "Talebiniz başarıyla gönderildi." });
  }

  const result = validate(body);
  if (result.error) {
    return res.status(400).json({ success: false, error: result.error });
  }
  const { name, phone, brand, message } = result.data;

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (!resendApiKey) {
    console.error("Yapılandırma hatası: RESEND_API_KEY tanımlı değil.");
    return res.status(500).json({ success: false, error: GENERIC_ERROR });
  }

  try {
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: "Portföy Formu <onboarding@resend.dev>",
      to: ["ccanerr936590@gmail.com"],
      subject: `Yeni İletişim Formu Talebi: ${brand || "Belirtilmedi"}`,
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
            ${escapeHtml(message).replaceAll("\n", "<br>")}
          </p>
        </div>
      `
    });

    if (error) {
      console.error("Resend hatası:", error.name, error.message);
      return res.status(502).json({ success: false, error: GENERIC_ERROR });
    }

    console.log("E-posta gönderildi:", data?.id);

    return res.status(200).json({
      success: true,
      message: "Talebiniz başarıyla gönderildi."
    });
  } catch (error) {
    console.error("Sistem hatası:", error?.message);
    return res.status(500).json({ success: false, error: GENERIC_ERROR });
  }
}

export function validate(body) {
  const name = cleanLine(body.name);
  const phone = String(body.phone ?? "").replace(/[\s\-()]/g, "");
  const brand = cleanLine(body.brand);
  const message = cleanText(body.message);

  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
    return { error: `Ad soyad ${LIMITS.name.min}-${LIMITS.name.max} karakter olmalıdır.` };
  }
  if (!/^[\p{L}\s.'-]+$/u.test(name)) {
    return { error: "Ad soyad yalnızca harf içermelidir." };
  }
  // Form numarayı +90 5XX XXX XX XX biçiminde gönderir.
  if (!/^\+905\d{9}$/.test(phone)) {
    return { error: "Lütfen geçerli bir cep telefonu girin (5XX XXX XX XX)." };
  }
  if (brand.length > LIMITS.brand.max) {
    return { error: `Marka / işletme adı en fazla ${LIMITS.brand.max} karakter olabilir.` };
  }
  if (message.length < LIMITS.message.min || message.length > LIMITS.message.max) {
    return { error: `Mesaj ${LIMITS.message.min}-${LIMITS.message.max} karakter olmalıdır.` };
  }
  const linkCount = (`${brand} ${message}`.match(/https?:\/\/|www\./gi) || []).length;
  if (linkCount > LIMITS.maxLinks) {
    return { error: "Mesajda çok fazla bağlantı var." };
  }

  return { data: { name, phone, brand, message } };
}

function isAllowedOrigin(origin) {
  if (!origin) return false;

  const allowed = new Set(PRODUCTION_ORIGINS);
  // Vercel'in kendi atadığı adresler (üretim alias'ı, dağıtım ve dal adresleri).
  // Bu değişkenler protokolsüz gelir; geçerli bir host değilse yok sayılır.
  for (const value of [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL
  ]) {
    const vercelOrigin = toHttpsOrigin(value);
    if (vercelOrigin) allowed.add(vercelOrigin);
  }
  for (const extra of (process.env.ALLOWED_ORIGINS || "").split(",")) {
    const extraOrigin = toHttpsOrigin(extra);
    if (extraOrigin) allowed.add(extraOrigin);
  }
  if (allowed.has(origin)) return true;

  return process.env.VERCEL_ENV !== "production" &&
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

// "alan.com", "https://alan.com" veya "https://alan.com/" → "https://alan.com".
// Yol, joker, http veya geçersiz host içeren değerler null döner.
function toHttpsOrigin(value) {
  const raw = String(value ?? "").trim().replace(/\/+$/, "");
  if (!raw) return null;

  const host = raw.replace(/^https:\/\//i, "").toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?::\d{1,5})?$/.test(host)) {
    return null;
  }
  return `https://${host}`;
}

function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || String(req.headers["x-real-ip"] || "") || req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < RATE_LIMIT.windowMs)) hits.delete(key);
    }
  }
  return recent.length > RATE_LIMIT.max;
}

function parseBody(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

// Tek satırlık alanlar: kontrol karakterleri ve satır sonları (konu satırı
// enjeksiyonuna karşı) boşluğa çevrilir.
function cleanLine(value) {
  return String(value ?? "").replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
