/* ---------------- The POD: entry, payment and preparation ---------------- */

const PLANS = {
  "pod-founding": { name: "The POD (founding cohort)", amountKobo: 3000000, currency: "NGN" }
};

const VOW = "I will keep the hour in unbroken silence for 21 consecutive days. If I break the silence, I return to Day 1.";
const FAITH_MODES = ["Christian", "Islamic", "Neutral"];
const LIFE_SEASONS = ["Rebuilding", "Re-ordering", "Stretching", "Winning", "Waiting"];
const TARGETS = ["Hope", "Focus", "Discipline", "Consistency", "Confidence", "Peace"];
const TONES = ["Gentle", "Firm", "Reassuring", "Directive"];
const HOURS = ["morning", "night"];

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

function podOpen(env) {
  return env.POD_OPEN === "true" && !!env.PAYSTACK_SECRET_KEY;
}

function paystackBase(env) {
  return env.PAYSTACK_API_BASE || "https://api.paystack.co";
}

function normalise(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function getByToken(env, token) {
  if (!token || typeof token !== "string" || token.length > 100) return null;
  return env.DB.prepare("SELECT * FROM pod_participants WHERE token = ?").bind(token).first();
}

function publicState(p) {
  return {
    name: p.name,
    paid: !!p.paid_at,
    plan: p.plan,
    assignmentDeclared: !!p.assignment_at,
    mindprint: p.mindprint_at ? {
      top5: JSON.parse(p.top5 || "[]"),
      faithMode: p.faith_mode,
      lifeSeason: p.life_season,
      primaryTarget: p.primary_target,
      tone: p.tone,
      chosenHour: p.chosen_hour
    } : null,
    vowTaken: !!p.vow_at,
    ready: !!(p.paid_at && p.assignment_at && p.mindprint_at && p.vow_at)
  };
}

async function markPaid(env, payment, tx) {
  if (tx.status !== "success") return false;
  if (tx.currency !== payment.currency || Number(tx.amount) < payment.amount_kobo) return false;
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE pod_payments SET status = 'success', verified_at = COALESCE(verified_at, ?), paystack_id = ?, channel = ? WHERE reference = ?"
    ).bind(now, String(tx.id || ""), String(tx.channel || ""), payment.reference),
    env.DB.prepare(
      "UPDATE pod_participants SET paid_at = COALESCE(paid_at, ?), plan = COALESCE(plan, ?), payment_reference = COALESCE(payment_reference, ?) WHERE id = ?"
    ).bind(now, payment.plan, payment.reference, payment.participant_id)
  ]);
  return true;
}

/* GET /api/pod/config */
function handleConfig(env) {
  return json({
    success: true,
    open: podOpen(env),
    plans: Object.entries(PLANS).map(([id, p]) => ({ id, name: p.name, amount: p.amountKobo / 100, currency: p.currency })),
    vow: VOW
  });
}

/* POST /api/pod/join  {name, email, plan} */
async function handleJoin(request, env, url) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!podOpen(env)) return json({ success: false, error: "The POD is not open yet." }, 403);

  const data = await readJson(request);
  const name = String(data?.name || "").trim().slice(0, 100);
  const email = String(data?.email || "").trim().toLowerCase().slice(0, 200);
  const planId = String(data?.plan || "pod-founding");
  const plan = PLANS[planId];
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: "Please enter your name and a valid email address." }, 400);
  }
  if (!plan) return json({ success: false, error: "Please choose a plan." }, 400);

  try {
    let p = await env.DB.prepare("SELECT * FROM pod_participants WHERE email = ?").bind(email).first();
    if (p && p.paid_at) {
      return json({
        success: false,
        alreadyPaid: true,
        error: "This email has already joined the POD. Use \"Restore my access\" with the reference on your Paystack receipt."
      }, 409);
    }
    if (!p) {
      const token = randomHex(24);
      const r = await env.DB.prepare(
        "INSERT INTO pod_participants (name, email, token, created_at) VALUES (?, ?, ?, ?)"
      ).bind(name, email, token, new Date().toISOString()).run();
      p = { id: r.meta.last_row_id, token };
    } else {
      await env.DB.prepare("UPDATE pod_participants SET name = ? WHERE id = ?").bind(name, p.id).run();
    }

    const reference = "POD-" + randomHex(8).toUpperCase();
    await env.DB.prepare(
      "INSERT INTO pod_payments (reference, participant_id, plan, amount_kobo, currency, status, created_at) VALUES (?, ?, ?, ?, ?, 'initialized', ?)"
    ).bind(reference, p.id, planId, plan.amountKobo, plan.currency, new Date().toISOString()).run();

    const res = await fetch(paystackBase(env) + "/transaction/initialize", {
      method: "POST",
      headers: { Authorization: "Bearer " + env.PAYSTACK_SECRET_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: plan.amountKobo,
        currency: plan.currency,
        reference,
        callback_url: url.origin + "/pod",
        metadata: { plan: planId, participant_id: p.id }
      })
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.status || !body?.data?.authorization_url) {
      return json({ success: false, error: "We could not open the payment page. Please try again." }, 502);
    }
    return json({ success: true, token: p.token, reference, authorizationUrl: body.data.authorization_url });
  } catch (error) {
    return json({ success: false, error: "We could not start your payment. Please try again." }, 500);
  }
}

/* GET /api/pod/verify?reference=... */
async function handleVerify(request, env, url) {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
  const reference = String(url.searchParams.get("reference") || "").trim().slice(0, 40);
  if (!/^POD-[0-9A-F]{16}$/.test(reference)) return json({ success: false, error: "Unknown payment reference." }, 400);

  try {
    const payment = await env.DB.prepare("SELECT * FROM pod_payments WHERE reference = ?").bind(reference).first();
    if (!payment) return json({ success: false, error: "Unknown payment reference." }, 404);

    if (payment.status !== "success") {
      const res = await fetch(paystackBase(env) + "/transaction/verify/" + encodeURIComponent(reference), {
        headers: { Authorization: "Bearer " + env.PAYSTACK_SECRET_KEY }
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.status && body.data) await markPaid(env, payment, body.data);
    }

    const p = await env.DB.prepare("SELECT * FROM pod_participants WHERE id = ?").bind(payment.participant_id).first();
    return json({ success: true, token: p.token, state: publicState(p) });
  } catch (error) {
    return json({ success: false, error: "We could not confirm your payment yet. Please refresh in a moment." }, 500);
  }
}

/* POST /api/pod/paystack-webhook  (called by Paystack) */
async function handleWebhook(request, env) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!env.PAYSTACK_SECRET_KEY) return new Response("Not configured", { status: 503 });

  const raw = await request.text();
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(env.PAYSTACK_SECRET_KEY),
    { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const expected = Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, "0")).join("");
  const given = String(request.headers.get("x-paystack-signature") || "").toLowerCase();
  let diff = expected.length ^ given.length;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ (given.charCodeAt(i) || 0);
  if (diff !== 0) return new Response("Invalid signature", { status: 401 });

  let event;
  try { event = JSON.parse(raw); } catch { return new Response("Bad request", { status: 400 }); }
  if (event?.event === "charge.success" && event.data?.reference) {
    const payment = await env.DB.prepare("SELECT * FROM pod_payments WHERE reference = ?")
      .bind(String(event.data.reference)).first();
    if (payment) await markPaid(env, payment, event.data);
  }
  return new Response("OK", { status: 200 });
}

/* POST /api/pod/recover  {email, reference} */
async function handleRecover(request, env) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const data = await readJson(request);
  const email = String(data?.email || "").trim().toLowerCase().slice(0, 200);
  const reference = String(data?.reference || "").trim().toUpperCase().slice(0, 40);
  try {
    const p = await env.DB.prepare(
      "SELECT * FROM pod_participants WHERE email = ? AND payment_reference = ? AND paid_at IS NOT NULL"
    ).bind(email, reference).first();
    if (!p) return json({ success: false, error: "We could not match that email and payment reference." }, 404);
    return json({ success: true, token: p.token, state: publicState(p) });
  } catch (error) {
    return json({ success: false, error: "We could not restore your access right now. Please try again." }, 500);
  }
}

/* GET /api/pod/state?token=... */
async function handleState(request, env, url) {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
  try {
    const p = await getByToken(env, url.searchParams.get("token"));
    if (!p) return json({ success: false, error: "Not found." }, 404);
    return json({ success: true, state: publicState(p) });
  } catch (error) {
    return json({ success: false, error: "Unable to load your POD." }, 500);
  }
}

/* POST /api/pod/assignment | /api/pod/mindprint | /api/pod/vow */
async function handlePrep(request, env, step) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const data = await readJson(request);
  try {
    const p = await getByToken(env, data?.token);
    if (!p) return json({ success: false, error: "Please open the POD again." }, 404);
    if (!p.paid_at) return json({ success: false, error: "Please complete your payment first." }, 402);
    const now = new Date().toISOString();

    if (step === "assignment") {
      const declaration = String(data?.declaration || "").trim().slice(0, 1000);
      if (data?.confirmed !== true || declaration.length < 20) {
        return json({ success: false, error: "Please confirm each part of the assignment and declare it in your own words." }, 400);
      }
      await env.DB.prepare("UPDATE pod_participants SET assignment_declaration = ?, assignment_at = ? WHERE id = ?")
        .bind(declaration, now, p.id).run();
    }

    if (step === "mindprint") {
      if (!p.assignment_at) return json({ success: false, error: "Please declare your assignment first." }, 409);
      const top5 = Array.isArray(data?.top5) ? data.top5.map(g => String(g || "").trim().slice(0, 200)) : [];
      const m = data || {};
      if (top5.length !== 5 || top5.some(g => g.length < 3)) {
        return json({ success: false, error: "Please enter all five of your top goals." }, 400);
      }
      if (!FAITH_MODES.includes(m.faithMode) || !LIFE_SEASONS.includes(m.lifeSeason) ||
          !TARGETS.includes(m.primaryTarget) || !TONES.includes(m.tone) || !HOURS.includes(m.chosenHour)) {
        return json({ success: false, error: "Please answer every question." }, 400);
      }
      await env.DB.prepare(
        "UPDATE pod_participants SET top5 = ?, faith_mode = ?, life_season = ?, primary_target = ?, tone = ?, chosen_hour = ?, mindprint_at = ? WHERE id = ?"
      ).bind(JSON.stringify(top5), m.faithMode, m.lifeSeason, m.primaryTarget, m.tone, m.chosenHour, now, p.id).run();
    }

    if (step === "vow") {
      if (!p.assignment_at || !p.mindprint_at) return json({ success: false, error: "Please complete the earlier steps first." }, 409);
      if (normalise(data?.vow) !== normalise(VOW)) {
        return json({ success: false, error: "Please write the vow exactly as it is shown." }, 400);
      }
      await env.DB.prepare("UPDATE pod_participants SET vow_at = COALESCE(vow_at, ?) WHERE id = ?").bind(now, p.id).run();
    }

    const fresh = await env.DB.prepare("SELECT * FROM pod_participants WHERE id = ?").bind(p.id).first();
    return json({ success: true, state: publicState(fresh) });
  } catch (error) {
    return json({ success: false, error: "We could not save this step. Please try again." }, 500);
  }
}

export async function handlePod(request, env, url) {
  switch (url.pathname) {
    case "/api/pod/config": return handleConfig(env);
    case "/api/pod/join": return handleJoin(request, env, url);
    case "/api/pod/verify": return handleVerify(request, env, url);
    case "/api/pod/paystack-webhook": return handleWebhook(request, env);
    case "/api/pod/recover": return handleRecover(request, env);
    case "/api/pod/state": return handleState(request, env, url);
    case "/api/pod/assignment": return handlePrep(request, env, "assignment");
    case "/api/pod/mindprint": return handlePrep(request, env, "mindprint");
    case "/api/pod/vow": return handlePrep(request, env, "vow");
  }
  return json({ success: false, error: "Not found." }, 404);
}
