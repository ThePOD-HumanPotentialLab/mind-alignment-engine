/* ---------------- The 2027 Blueprint: registration and payment ---------------- */
import { paystackKey, paystackInitialize, paystackVerify } from "./paystack.js";

const EVENT = {
  id: "blueprint-2027",
  name: "The 2027 Blueprint",
  // End of Monday 16 November 2026, Lagos time (UTC+1)
  earlyBirdEndsAt: "2026-11-16T23:00:00Z",
  // End of Thursday 26 November 2026, Lagos time
  closesAt: "2026-11-26T23:00:00Z",
  onsiteSeats: 50,
  // Participants' WhatsApp group invite. Shown only to paid registrants on their confirmation page.
  groupLink: "",
  // Bank details for transfer payments (shown only after someone reserves a seat).
  bank: { bank: "Wema Bank", accountName: "Joshua Ochu", accountNumber: "0286120995" },
  showSeatsLeftBelow: 15,
  formats: {
    onsite:  { label: "Onsite, Mabushi, Abuja", early: 11200000, standard: 14000000 },
    virtual: { label: "Virtual, live online",    early: 5600000,  standard: 7000000 }
  }
};

const HEARD = ["WhatsApp", "LinkedIn", "Instagram", "Facebook", "A friend or colleague", "Josh Ochu directly", "My organisation", "Other"];

let tableReady = false;
async function ensureTable(env) {
  if (tableReady) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS blueprint_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference TEXT UNIQUE NOT NULL,
    event TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    organisation TEXT,
    role TEXT,
    heard TEXT,
    format TEXT NOT NULL,
    price_tier TEXT NOT NULL,
    amount_kobo INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    paid_at TEXT,
    paystack_id TEXT,
    channel TEXT
  )`).run();
  tableReady = true;
}

function json(body, status = 200) {
  return Response.json(body, { status });
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

function randomHex(bytes) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
}

function clean(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function tierNow(now = Date.now()) {
  return now < Date.parse(EVENT.earlyBirdEndsAt) ? "early" : "standard";
}

async function onsitePaid(env) {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM blueprint_registrations WHERE event = ? AND format = 'onsite' AND status = 'success'"
  ).bind(EVENT.id).first();
  return Number(row?.n || 0);
}

function ticket(r) {
  return {
    reference: r.reference,
    name: r.name,
    format: r.format,
    formatLabel: EVENT.formats[r.format]?.label || r.format,
    amount: r.amount_kobo / 100,
    paid: r.status === "success",
    groupLink: r.status === "success" && EVENT.groupLink ? EVENT.groupLink : null,
    reserved: r.status === "reserved",
    bank: r.status === "reserved" && EVENT.bank.accountNumber ? EVENT.bank : null
  };
}

/* Called by the Paystack webhook (shared with the POD) and by verify */
export async function markBlueprintPaid(env, reference, tx) {
  await ensureTable(env);
  const r = await env.DB.prepare("SELECT * FROM blueprint_registrations WHERE reference = ?").bind(reference).first();
  if (!r) return null;
  if (r.status === "success") return r;
  if (tx?.status !== "success" || tx.currency !== r.currency || Number(tx.amount) < r.amount_kobo) return r;
  await env.DB.prepare(
    "UPDATE blueprint_registrations SET status = 'success', paid_at = COALESCE(paid_at, ?), paystack_id = ?, channel = ? WHERE reference = ?"
  ).bind(new Date().toISOString(), String(tx.id || ""), String(tx.channel || ""), reference).run();
  return env.DB.prepare("SELECT * FROM blueprint_registrations WHERE reference = ?").bind(reference).first();
}

/* GET /api/blueprint/config */
async function handleConfig(env) {
  await ensureTable(env);
  const now = Date.now();
  const tier = tierNow(now);
  const taken = await onsitePaid(env);
  const left = Math.max(0, EVENT.onsiteSeats - taken);
  return json({
    success: true,
    open: now < Date.parse(EVENT.closesAt),
    payments: !!paystackKey(env),
    testMode: env.PAYSTACK_MODE === "test",
    tier,
    earlyBirdEndsAt: EVENT.earlyBirdEndsAt,
    closesAt: EVENT.closesAt,
    onsiteSoldOut: left === 0,
    onsiteLeft: left <= EVENT.showSeatsLeftBelow ? left : null,
    prices: Object.fromEntries(Object.entries(EVENT.formats).map(([k, f]) => [k, {
      label: f.label, now: f[tier] / 100, standard: f.standard / 100, early: f.early / 100
    }])),
    heard: HEARD
  });
}

/* POST /api/blueprint/register */
async function handleRegister(request, env, url) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  await ensureTable(env);
  if (Date.now() >= Date.parse(EVENT.closesAt)) {
    return json({ success: false, error: "Registration for The 2027 Blueprint has closed." }, 403);
  }

  const d = await readJson(request) || {};
  const name = clean(d.name, 100);
  const email = clean(d.email, 200).toLowerCase();
  const phone = clean(d.phone, 30);
  const organisation = clean(d.organisation, 120);
  const role = clean(d.role, 120);
  const heard = HEARD.includes(d.heard) ? d.heard : "";
  const format = d.format;

  if (name.length < 2) return json({ success: false, error: "Please enter your full name." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ success: false, error: "Please enter a valid email address. Your receipt goes there." }, 400);
  if (phone.replace(/\D/g, "").length < 10) return json({ success: false, error: "Please enter your WhatsApp number." }, 400);
  if (!EVENT.formats[format]) return json({ success: false, error: "Please choose onsite or virtual." }, 400);

  if (format === "onsite" && await onsitePaid(env) >= EVENT.onsiteSeats) {
    return json({ success: false, soldOut: true, error: "Onsite seats are now full. Virtual seats are still open." }, 409);
  }

  const tier = tierNow();
  const amount = EVENT.formats[format][tier];
  const reference = "BP-" + randomHex(8).toUpperCase();
  const payments = !!paystackKey(env);
  const now = new Date().toISOString();

  await env.DB.prepare(`INSERT INTO blueprint_registrations
    (reference, event, name, email, phone, organisation, role, heard, format, price_tier, amount_kobo, currency, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NGN', ?, ?)`)
    .bind(reference, EVENT.id, name, email, phone, organisation, role, heard, format, tier, amount,
      payments ? "initialized" : "reserved", now).run();

  // No Paystack key yet: hold the seat and complete payment by transfer over WhatsApp.
  if (!payments) return json({ success: true, reserved: true, reference, amount: amount / 100 });

  try {
    const data = await paystackInitialize(env, {
      email,
      amount,
      currency: "NGN",
      reference,
      callback_url: url.origin + "/blueprint",
      metadata: {
        event: EVENT.id,
        custom_fields: [
          { display_name: "Programme", variable_name: "programme", value: EVENT.name },
          { display_name: "Format", variable_name: "format", value: EVENT.formats[format].label },
          { display_name: "Name", variable_name: "name", value: name },
          { display_name: "WhatsApp", variable_name: "phone", value: phone }
        ]
      }
    });
    if (!data) throw new Error("initialize failed");
    return json({ success: true, reference, authorizationUrl: data.authorization_url });
  } catch (error) {
    await env.DB.prepare("UPDATE blueprint_registrations SET status = 'failed' WHERE reference = ?").bind(reference).run();
    return json({ success: false, error: "We could not open the payment page. Please try again, or message us on WhatsApp." }, 502);
  }
}

/* GET /api/blueprint/verify?reference=BP-... */
async function handleVerify(env, url) {
  await ensureTable(env);
  const reference = clean(url.searchParams.get("reference"), 40).toUpperCase();
  if (!/^BP-[0-9A-F]{16}$/.test(reference)) return json({ success: false, error: "Unknown registration reference." }, 400);

  let r = await env.DB.prepare("SELECT * FROM blueprint_registrations WHERE reference = ?").bind(reference).first();
  if (!r) return json({ success: false, error: "Unknown registration reference." }, 404);

  if (r.status === "initialized" && paystackKey(env)) {
    try {
      const tx = await paystackVerify(env, reference);
      if (tx) r = await markBlueprintPaid(env, reference, tx) || r;
    } catch { /* fall through with the stored status */ }
  }
  return json({ success: true, ticket: ticket(r) });
}

/* POST /api/blueprint/admin/mark-paid  {reference}  (Authorization: Bearer <BLUEPRINT_ADMIN_KEY>)
   Confirms a bank-transfer reservation once the money has arrived. */
async function handleMarkPaid(request, env) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const key = env.BLUEPRINT_ADMIN_KEY;
  const given = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!key || given !== key) return json({ success: false, error: "Not authorised." }, 401);
  await ensureTable(env);
  const d = await readJson(request) || {};
  const reference = clean(d.reference, 40).toUpperCase();
  const r = await env.DB.prepare(
    "UPDATE blueprint_registrations SET status = 'success', paid_at = COALESCE(paid_at, ?), channel = 'bank transfer (confirmed by admin)' WHERE reference = ? AND status IN ('reserved', 'initialized', 'failed')"
  ).bind(new Date().toISOString(), reference).run();
  if (!r.meta.changes) return json({ success: false, error: "No unpaid registration with that reference." }, 404);
  return json({ success: true });
}

/* GET /api/blueprint/admin  (Authorization: Bearer <BLUEPRINT_ADMIN_KEY>)  ?format=csv */
async function handleAdmin(request, env, url) {
  const key = env.BLUEPRINT_ADMIN_KEY;
  const given = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!key || given !== key) return json({ success: false, error: "Not authorised." }, 401);
  await ensureTable(env);

  const { results } = await env.DB.prepare(
    "SELECT reference, name, email, phone, organisation, role, heard, format, price_tier, amount_kobo, status, created_at, paid_at, channel FROM blueprint_registrations WHERE event = ? ORDER BY id DESC"
  ).bind(EVENT.id).all();
  const rows = results.map(r => ({ ...r, amount: r.amount_kobo / 100 }));

  if (url.searchParams.get("format") === "csv") {
    const cols = ["reference", "status", "name", "email", "phone", "organisation", "role", "heard", "format", "price_tier", "amount", "created_at", "paid_at", "channel"];
    const esc = v => {
      let s = String(v ?? "");
      if (/^[=+\-@]/.test(s)) s = "'" + s; // keep spreadsheet formulas out
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [cols.join(","), ...rows.map(r => cols.map(c => esc(r[c])).join(","))].join("\n");
    return new Response(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="blueprint-2027-registrations.csv"' }
    });
  }

  const paid = rows.filter(r => r.status === "success");
  return json({
    success: true,
    summary: {
      paid: paid.length,
      onsite: paid.filter(r => r.format === "onsite").length,
      virtual: paid.filter(r => r.format === "virtual").length,
      reserved: rows.filter(r => r.status === "reserved").length,
      revenue: paid.reduce((s, r) => s + r.amount, 0)
    },
    rows
  });
}

export async function handleBlueprint(request, env, url) {
  try {
    switch (url.pathname) {
      case "/api/blueprint/config": return await handleConfig(env);
      case "/api/blueprint/register": return await handleRegister(request, env, url);
      case "/api/blueprint/verify": return await handleVerify(env, url);
      case "/api/blueprint/admin": return await handleAdmin(request, env, url);
      case "/api/blueprint/admin/mark-paid": return await handleMarkPaid(request, env);
    }
    return json({ success: false, error: "Not found." }, 404);
  } catch (error) {
    return json({ success: false, error: "Something went wrong. Please try again, or message us on WhatsApp." }, 500);
  }
}
