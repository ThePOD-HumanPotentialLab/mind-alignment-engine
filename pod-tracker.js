/* ---------------- The POD: the 21-day tracker and the certificate ---------------- */
/* All days follow Africa/Lagos time (UTC+1, no daylight saving). */

const LAGOS_MS = 60 * 60 * 1000;
const DAYS = 21;
const WINDOW_DAYS = 60;
const WARN_DAYS = 10;

function json(body, status = 200) {
  return Response.json(body, { status });
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

function nowMs(request, env) {
  // A simulated clock for local testing only. Never set POD_TEST_CLOCK on staging or production.
  if (env.POD_TEST_CLOCK === "true") {
    const t = Number(request.headers.get("x-pod-test-now"));
    if (Number.isFinite(t) && t > 0) return t;
  }
  return Date.now();
}

function lagos(ms) {
  const d = new Date(ms + LAGOS_MS);
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}

function addDays(date, n) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

/* Check-in windows.
   Morning: the hour is kept first thing; check in from 04:00 until midnight the same day.
   Night: the hour is kept last thing; check in from 18:00 until noon the next day. */
function windows(ms, hour) {
  const { date, hour: h } = lagos(ms);
  if (hour === "night") {
    if (h >= 18) return { open: date, closedThrough: addDays(date, -1) };
    if (h < 12) return { open: addDays(date, -1), closedThrough: addDays(date, -2) };
    return { open: null, closedThrough: addDays(date, -1) };
  }
  if (h >= 4) return { open: date, closedThrough: addDays(date, -1) };
  return { open: null, closedThrough: addDays(date, -1) };
}

function firstName(name) {
  let f = (String(name || "").trim().split(/[\s,]+/)[0] || "").replace(/[^A-Za-z\u00C0-\u024F'-]/g, "");
  return f ? f.charAt(0).toUpperCase() + f.slice(1).toLowerCase() : "";
}

function niceDate(date) {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

async function getParticipant(env, token) {
  if (!token || typeof token !== "string" || token.length > 100) return null;
  return env.DB.prepare("SELECT * FROM pod_participants WHERE token = ?").bind(token).first();
}

async function keptInRun(env, p) {
  const r = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM pod_checkins WHERE participant_id = ? AND run_number = ? AND kept = 1"
  ).bind(p.id, p.run_number || 1).first();
  return r ? r.n : 0;
}

/* Bring the participant's run up to date: start Day 1, apply the missed-day rule. */
async function refresh(env, p, ms) {
  if (!p.vow_at || !p.paid_at) return p;
  if (!p.day1_date) {
    const day1 = addDays(lagos(Date.parse(p.vow_at)).date, 1);
    await env.DB.prepare("UPDATE pod_participants SET day1_date = ?, window_start = ?, run_number = 1 WHERE id = ?")
      .bind(day1, day1, p.id).run();
    p = { ...p, day1_date: day1, window_start: day1, run_number: 1 };
  }
  if (p.completed_at) return p;

  const kept = await keptInRun(env, p);
  const expected = addDays(p.day1_date, kept);
  const windowEnd = addDays(p.window_start, WINDOW_DAYS - 1);
  const { closedThrough } = windows(ms, p.chosen_hour);

  if (expected <= closedThrough && expected <= windowEnd) {
    const day1 = addDays(closedThrough, 1);
    const run = (p.run_number || 1) + 1;
    await env.DB.prepare("UPDATE pod_participants SET day1_date = ?, run_number = ?, last_event = ? WHERE id = ?")
      .bind(day1, run, "missed:" + day1, p.id).run();
    p = { ...p, day1_date: day1, run_number: run, last_event: "missed:" + day1 };
  }
  return p;
}

const MESSAGES = {
  prompt: (n, goal) =>
    `Be still. Day ${n} of 21. What you plant and repeat, the deeper mind accepts and grows. Your seed today: "${goal}". Write it. See it. Act from it. Keep the hour.`,
  kept: (name, carry, n) =>
    `Thank you${name ? ", " + name : ""}. You kept the hour, and you looked at yourself honestly. You said you will carry this: "${carry}". Carry it fully today. Day ${n} is complete. Day ${n + 1} is next. Keep the hour.`,
  broken: date =>
    `Thank you for telling the truth. That honesty is part of the discipline. The silence was broken, so Day 1 begins ${niceDate(date)}. Before then, decide what will protect your hour. Walk the law.`,
  missed: date =>
    `A day passed without your check-in, so the count returns to Day 1. This is the rule, not a judgement. Day 1 begins ${niceDate(date)}. Return to the hour. Walk the law.`,
  day7: (name, carries) =>
    `Seven unbroken days${name ? ", " + name : ""}. A week ago this was a decision. Now it is becoming a discipline. Look back at what you carried this week: ${carries.map(c => `"${c}"`).join("; ")}. The seed is taking root. Guard the hour. Day 8 is next.`,
  day14: () =>
    "Fourteen unbroken days. What you once had to force, you now return to. That is the law at work: what you repeat, you become. Seven days remain. Do not loosen your grip now. Finish what you started. Keep the hour.",
  day21: name =>
    `Twenty-one unbroken days${name ? ", " + name : ""}. You gave your word to yourself, and you kept it. That is no small thing. Very few people keep a promise to themselves for twenty-one days. You did. Your certificate and your declaration are ready. Print them, and keep them where you will see them. The drill is complete. The practice continues.`,
  closing: (left, lastStart) =>
    `${left} days remain in your POD window. Day 21 is still within reach if you begin your unbroken run by ${niceDate(lastStart)}. Every return to Day 1 is a lesson, not a loss. Keep the hour.`,
  ended: total =>
    `Your 60 days in the POD have ended. You kept the hour ${total} ${total === 1 ? "time" : "times"}, and every hour was a seed planted. The rule was strict because the prize is real. When you are ready, you can begin the drill again, or continue the practice with the Optimizer. Walk the law.`
};

async function view(env, p, ms) {
  const kept = await keptInRun(env, p);
  const total = await env.DB.prepare("SELECT COUNT(*) AS n FROM pod_checkins WHERE participant_id = ? AND kept = 1")
    .bind(p.id).first();
  const totalKept = total ? total.n : 0;
  const today = lagos(ms).date;
  const windowEnd = addDays(p.window_start, WINDOW_DAYS - 1);
  const expected = addDays(p.day1_date, kept);
  const { open } = windows(ms, p.chosen_hour);
  const completed = !!p.completed_at;
  const ended = !completed && expected > windowEnd;
  const daysLeft = Math.min(WINDOW_DAYS, Math.max(0, daysBetween(today, windowEnd) + 1));
  const top5 = JSON.parse(p.top5 || "[]");
  const name = firstName(p.name);

  let notice = null;
  if (ended) notice = MESSAGES.ended(totalKept);
  else if (!completed && p.last_event && kept === 0) {
    const [kind, date] = p.last_event.split(":");
    notice = kind === "missed" ? MESSAGES.missed(date) : kind === "broken" ? MESSAGES.broken(date) : null;
  }
  let warning = null;
  const lastStart = addDays(windowEnd, -(DAYS - 1));
  if (!completed && !ended && kept === 0 && p.day1_date <= lastStart && daysBetween(today, lastStart) <= WARN_DAYS) {
    warning = MESSAGES.closing(daysLeft, lastStart);
  }

  return {
    name,
    chosenHour: p.chosen_hour,
    top5,
    day1Date: p.day1_date,
    kept,
    nextDay: Math.min(kept + 1, DAYS),
    nextDate: expected,
    checkinOpen: !completed && !ended && open === expected,
    opens: p.chosen_hour === "night" ? "6:00 pm" : "4:00 am",
    closes: p.chosen_hour === "night" ? "12 noon the next day" : "midnight",
    restarts: (p.run_number || 1) - 1,
    totalKept,
    windowEnd,
    daysLeft,
    completed,
    ended,
    certificateNo: p.certificate_no || null,
    prompt: !completed && !ended ? MESSAGES.prompt(kept + 1, top5[kept % 5] || "") : null,
    notice,
    warning,
    completion: completed ? MESSAGES.day21(name) : null
  };
}

/* GET /api/pod/tracker?token=... */
async function handleTracker(request, env, url) {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
  try {
    let p = await getParticipant(env, url.searchParams.get("token"));
    if (!p) return json({ success: false, error: "Not found." }, 404);
    if (!p.vow_at) return json({ success: false, error: "Please complete your preparation first." }, 409);
    const ms = nowMs(request, env);
    p = await refresh(env, p, ms);
    return json({ success: true, tracker: await view(env, p, ms) });
  } catch (error) {
    return json({ success: false, error: "We could not load your 21 days. Please refresh." }, 500);
  }
}

/* POST /api/pod/checkin  {token, kept, saw, learned, carry} */
async function handleCheckin(request, env) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const data = await readJson(request);
  try {
    let p = await getParticipant(env, data?.token);
    if (!p) return json({ success: false, error: "Please open the POD again." }, 404);
    if (!p.vow_at) return json({ success: false, error: "Please complete your preparation first." }, 409);
    const ms = nowMs(request, env);
    p = await refresh(env, p, ms);
    const v = await view(env, p, ms);
    if (v.completed) return json({ success: false, error: "You have completed the 21 days." }, 409);
    if (v.ended) return json({ success: false, error: "Your POD window has ended." }, 409);
    if (!v.checkinOpen) {
      return json({ success: false, error: `Your Day ${v.nextDay} check-in opens on ${niceDate(v.nextDate)} at ${v.opens}.` }, 409);
    }

    const now = new Date(ms).toISOString();
    const day = v.kept + 1;
    let reply;

    if (data?.kept === true) {
      const clean = s => String(s || "").trim().slice(0, 1000);
      const saw = clean(data.saw), learned = clean(data.learned), carry = clean(data.carry);
      if (saw.length < 3 || learned.length < 3 || carry.length < 3) {
        return json({ success: false, error: "Please answer all three Mirror Moment questions, even in a single sentence each." }, 400);
      }
      await env.DB.prepare(
        "INSERT INTO pod_checkins (participant_id, practice_date, run_number, day_number, kept, saw, learned, carry, created_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)"
      ).bind(p.id, v.nextDate, p.run_number || 1, day, saw, learned, carry, now).run();

      if (day === DAYS) {
        const certNo = "POD-" + v.nextDate.slice(0, 4) + "-" + String(p.id).padStart(4, "0") + "-" +
          Array.from(crypto.getRandomValues(new Uint8Array(2)), b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
        await env.DB.prepare("UPDATE pod_participants SET completed_at = ?, certificate_no = ?, last_event = NULL WHERE id = ?")
          .bind(now, certNo, p.id).run();
        p = { ...p, completed_at: now, certificate_no: certNo };
        reply = MESSAGES.day21(v.name);
      } else {
        await env.DB.prepare("UPDATE pod_participants SET last_event = NULL WHERE id = ?").bind(p.id).run();
        p = { ...p, last_event: null };
        if (day === 7) {
          const { results } = await env.DB.prepare(
            "SELECT carry FROM pod_checkins WHERE participant_id = ? AND run_number = ? AND kept = 1 ORDER BY day_number DESC LIMIT 3"
          ).bind(p.id, p.run_number || 1).all();
          reply = MESSAGES.day7(v.name, results.map(r => r.carry).reverse());
        } else if (day === 14) {
          reply = MESSAGES.day14();
        } else {
          reply = MESSAGES.kept(v.name, carry, day);
        }
      }
    } else if (data?.kept === false) {
      const day1 = addDays(v.nextDate, 1);
      const run = (p.run_number || 1) + 1;
      await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO pod_checkins (participant_id, practice_date, run_number, day_number, kept, created_at) VALUES (?, ?, ?, ?, 0, ?)"
        ).bind(p.id, v.nextDate, p.run_number || 1, day, now),
        env.DB.prepare("UPDATE pod_participants SET day1_date = ?, run_number = ?, last_event = ? WHERE id = ?")
          .bind(day1, run, "broken:" + day1, p.id)
      ]);
      p = { ...p, day1_date: day1, run_number: run, last_event: "broken:" + day1 };
      reply = MESSAGES.broken(day1);
    } else {
      return json({ success: false, error: "Please answer the silence question." }, 400);
    }

    return json({ success: true, reply, tracker: await view(env, p, ms) });
  } catch (error) {
    return json({ success: false, error: "We could not save your check-in. Please try again." }, 500);
  }
}

/* GET /api/pod/certificate?token=...  or  ?no=CERTIFICATE-NUMBER (public verification) */
async function handleCertificate(request, env, url) {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
  try {
    const no = String(url.searchParams.get("no") || "").trim().toUpperCase().slice(0, 40);
    if (no) {
      const p = await env.DB.prepare("SELECT name, day1_date, completed_at FROM pod_participants WHERE certificate_no = ?").bind(no).first();
      if (!p || !p.completed_at) return json({ success: true, valid: false });
      return json({ success: true, valid: true, name: p.name, start: p.day1_date, end: addDays(p.day1_date, DAYS - 1) });
    }

    const p = await getParticipant(env, url.searchParams.get("token"));
    if (!p) return json({ success: false, error: "Not found." }, 404);
    if (!p.completed_at) return json({ success: false, error: "The certificate opens when you complete Day 21." }, 409);
    const { results } = await env.DB.prepare(
      "SELECT day_number, saw, carry FROM pod_checkins WHERE participant_id = ? AND run_number = ? AND kept = 1 AND day_number IN (7, 14, 21) ORDER BY day_number"
    ).bind(p.id, p.run_number || 1).all();
    return json({
      success: true,
      certificate: {
        name: p.name,
        start: p.day1_date,
        end: addDays(p.day1_date, DAYS - 1),
        certificateNo: p.certificate_no,
        top5: JSON.parse(p.top5 || "[]"),
        saw: results.map(r => r.saw),
        carried: results.map(r => r.carry),
        faithMode: p.faith_mode
      }
    });
  } catch (error) {
    return json({ success: false, error: "We could not load the certificate. Please refresh." }, 500);
  }
}

export async function handleTrackerRoutes(request, env, url) {
  switch (url.pathname) {
    case "/api/pod/tracker": return handleTracker(request, env, url);
    case "/api/pod/checkin": return handleCheckin(request, env);
    case "/api/pod/certificate": return handleCertificate(request, env, url);
  }
  return json({ success: false, error: "Not found." }, 404);
}
