/* 5 Minutes with Daddy: Gift a Year.
   The giver fills in the family's details on /daddy/gift and receives a gift code.
   They pay on Selar (selar.com/5mwd-gift), where checkout asks for that code.
   They get a gift card page to send to the family on WhatsApp.
   The team matches the Selar sale to the code on /daddy/gift-admin, then marks it paid and activated. */
import { notifyJosh, firstName } from "./notify.js";

const SELAR_GIFT = "https://selar.com/5mwd-gift";
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
const STATUSES = ["pending", "paid", "activated", "cancelled"];

function json(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

function randomFrom(chars, n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, x => chars[x % chars.length]).join("");
}

function randomHex(bytes) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
}

function adminOk(request, env) {
  const key = env.POD_ADMIN_KEY || env.BLUEPRINT_ADMIN_KEY;
  const given = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  return !!key && given === key;
}

const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// Keep digits and a leading +; a Nigerian 0XXXXXXXXXX number becomes 234XXXXXXXXXX for WhatsApp links.
function phone(v) {
  let s = String(v ?? "").replace(/[^\d+]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  if (/^0\d{10}$/.test(s)) s = "234" + s.slice(1);
  return /^\d{8,15}$/.test(s) ? s : "";
}

const email = v => {
  const s = clean(v, 120).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : "";
};

async function ensureTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS daddy_gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    card_token TEXT NOT NULL UNIQUE,
    giver_name TEXT NOT NULL,
    giver_whatsapp TEXT NOT NULL,
    giver_email TEXT,
    recipient_name TEXT NOT NULL,
    recipient_whatsapp TEXT NOT NULL,
    recipient_email TEXT,
    start_when TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    note TEXT,
    created_at TEXT NOT NULL,
    paid_at TEXT,
    activated_at TEXT
  )`).run();
}

/* POST /api/daddy/gift  → { code, card, pay } */
async function createGift(request, env) {
  if (request.method !== "POST") return json({ success: false, error: "Use POST." }, 405);
  const b = await readJson(request);
  if (!b) return json({ success: false, error: "We could not read the form. Please try again." }, 400);
  if (clean(b.website, 50)) return json({ success: false, error: "Please try again." }, 400); // honeypot

  const g = {
    giver_name: clean(b.giverName, 60),
    giver_whatsapp: phone(b.giverWhatsapp),
    giver_email: email(b.giverEmail),
    recipient_name: clean(b.recipientName, 60),
    recipient_whatsapp: phone(b.recipientWhatsapp),
    recipient_email: email(b.recipientEmail),
    message: String(b.message ?? "").trim().slice(0, 400),
  };
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(b.startDate || "")) ? b.startDate : "";
  g.start_when = b.startMode === "date" && startDate ? startDate : "right away";

  const missing = [];
  if (!g.giver_name) missing.push("your name");
  if (!g.giver_whatsapp) missing.push("your WhatsApp number");
  if (!g.recipient_name) missing.push("the family's name");
  if (!g.recipient_whatsapp) missing.push("their WhatsApp number");
  if (b.startMode === "date" && !startDate) missing.push("the start date");
  if (missing.length) return json({ success: false, error: "Please add " + missing.join(", ") + "." }, 400);

  await ensureTable(env);
  const now = new Date().toISOString();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = "GIFT-" + randomFrom(CODE_CHARS, 5);
    const token = randomHex(16);
    try {
      await env.DB.prepare(`INSERT INTO daddy_gifts (code, card_token, giver_name, giver_whatsapp, giver_email, recipient_name, recipient_whatsapp, recipient_email, start_when, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(code, token, g.giver_name, g.giver_whatsapp, g.giver_email || null, g.recipient_name, g.recipient_whatsapp, g.recipient_email || null, g.start_when, g.message || null, now).run();
      const origin = new URL(request.url).origin;
      await notifyJosh(env, {
        title: "5MWD gift started: " + code,
        message: firstName(g.giver_name) + " is gifting a year to " + firstName(g.recipient_name) + ". Watch Selar for a Gift a Year sale with code " + code + ".",
        click: origin + "/daddy/gift-admin", tags: "gift"
      });
      return json({ success: true, code, card: origin + "/daddy/card?t=" + token, pay: SELAR_GIFT });
    } catch (e) {
      if (!/UNIQUE/i.test(String(e && e.message))) {
        return json({ success: false, error: "We could not save your gift. Please try again." }, 500);
      }
    }
  }
  return json({ success: false, error: "We could not create a gift code. Please try again." }, 500);
}

/* GET /api/daddy/gift/card?t=token  → what the gift card shows (first names only) */
async function giftCard(request, env, url) {
  const t = String(url.searchParams.get("t") || "");
  if (!/^[a-f0-9]{32}$/.test(t)) return json({ success: false, error: "This gift card link is not complete." }, 404);
  await ensureTable(env);
  const g = await env.DB.prepare("SELECT code, giver_name, recipient_name, recipient_whatsapp, start_when, message, status FROM daddy_gifts WHERE card_token = ?").bind(t).first();
  if (!g || g.status === "cancelled") return json({ success: false, error: "We could not find this gift card." }, 404);
  return json({
    success: true,
    code: g.code,
    from: g.giver_name,
    to: g.recipient_name,
    toWhatsapp: g.recipient_whatsapp,
    start: g.start_when,
    message: g.message || "",
    status: g.status
  });
}

/* GET /api/daddy/gift/admin?code=…  (Authorization: Bearer <POD_ADMIN_KEY>) */
async function adminList(request, env, url) {
  if (!adminOk(request, env)) return json({ success: false, error: "Not authorised." }, 401);
  await ensureTable(env);
  const code = clean(url.searchParams.get("code"), 20).toUpperCase();
  const stmt = code
    ? env.DB.prepare("SELECT * FROM daddy_gifts WHERE code = ? OR code = ?").bind(code, "GIFT-" + code.replace(/^GIFT-?/, ""))
    : env.DB.prepare("SELECT * FROM daddy_gifts ORDER BY created_at DESC LIMIT 300");
  const { results } = await stmt.all();
  const counts = await env.DB.prepare("SELECT status, COUNT(*) AS n FROM daddy_gifts GROUP BY status").all();
  return json({ success: true, gifts: results.map(({ card_token, ...rest }) => rest), counts: counts.results });
}

/* POST /api/daddy/gift/admin/status {code, status, note}  (Bearer) */
async function adminStatus(request, env) {
  if (request.method !== "POST") return json({ success: false, error: "Use POST." }, 405);
  if (!adminOk(request, env)) return json({ success: false, error: "Not authorised." }, 401);
  const b = await readJson(request) || {};
  const code = clean(b.code, 20).toUpperCase();
  const status = String(b.status || "");
  if (!STATUSES.includes(status)) return json({ success: false, error: "Unknown status." }, 400);
  await ensureTable(env);
  const now = new Date().toISOString();
  const r = await env.DB.prepare(`UPDATE daddy_gifts SET status = ?,
      paid_at = CASE WHEN ? IN ('paid','activated') THEN COALESCE(paid_at, ?) ELSE paid_at END,
      activated_at = CASE WHEN ? = 'activated' THEN COALESCE(activated_at, ?) ELSE activated_at END,
      note = COALESCE(?, note)
    WHERE code = ?`).bind(status, status, now, status, now, b.note ? clean(b.note, 300) : null, code).run();
  if (!r.meta || !r.meta.changes) return json({ success: false, error: "No gift with that code." }, 404);
  return json({ success: true });
}

export async function handleGift(request, env, url) {
  try {
    switch (url.pathname) {
      case "/api/daddy/gift": return await createGift(request, env);
      case "/api/daddy/gift/card": return await giftCard(request, env, url);
      case "/api/daddy/gift/admin": return await adminList(request, env, url);
      case "/api/daddy/gift/admin/status": return await adminStatus(request, env);
    }
    return json({ success: false, error: "Not found." }, 404);
  } catch (e) {
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }
}
