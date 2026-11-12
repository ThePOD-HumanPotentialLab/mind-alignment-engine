/* Mind Alignment Index results for Josh: GET /api/admin/results (admin key, same as the Blueprint admin).
   Read only. Shows the people who saved their result (name, email, consent given), their pattern,
   where they came from (?ref=) and how far they have gone in the 7-Day Mind Reset. */
import { notifyJosh, firstName } from "./notify.js";

export const PATTERN_TITLES = {
  visionExecution: "Vision–Execution Gap",
  identityExecution: "Identity–Behaviour Gap",
  emotionalOverride: "Emotional Override",
  agencyAction: "Agency–Action Gap",
  relationalAdaptation: "Relational Adaptation",
  fragmentedDirection: "Fragmented Direction",
  expansionReadiness: "Expansion Readiness",
  integrated: "Integrated",
  unevenGarden: "Uneven Garden",
  earlyGround: "Early Ground"
};
const title = k => PATTERN_TITLES[k] || k || "";

function adminOk(request, env) {
  const key = env.BLUEPRINT_ADMIN_KEY || env.POD_ADMIN_KEY;
  const keys = [env.BLUEPRINT_ADMIN_KEY, env.POD_ADMIN_KEY].filter(Boolean);
  const given = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  return !!key && keys.includes(given);
}

function parse(s) { try { return JSON.parse(s || "{}") || {}; } catch (e) { return {}; } }

export async function handleResultsAdmin(request, env) {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
  if (!adminOk(request, env)) return Response.json({ success: false, error: "Wrong admin key." }, { status: 401 });
  const rows = (await env.DB.prepare(
    `SELECT a.id, a.created_at, a.name, a.email, a.overall_score, a.primary_pattern, a.secondary_pattern,
            a.assessment_version, a.response_quality, a.dimension_scores,
            r.started_at AS reset_started, (SELECT COUNT(*) FROM reset_progress p WHERE p.participant_id = r.id) AS reset_days
       FROM assessment_results a LEFT JOIN reset_participants r ON r.email = a.email
      ORDER BY a.id DESC LIMIT 300`
  ).all()).results || [];
  const out = rows.map(x => {
    const q = parse(x.response_quality);
    const dims = parse(x.dimension_scores);
    const low = Object.entries(dims).filter(([, v]) => typeof v === "number").sort((a, b) => a[1] - b[1])[0];
    return {
      date: x.created_at, name: x.name, email: x.email, whatsapp: q.whatsapp || null,
      pattern: title(x.primary_pattern), secondary: title(x.secondary_pattern),
      score: x.overall_score, lowest: low ? low[0] + " (" + Math.round(low[1]) + ")" : "",
      source: q.source || "", version: x.assessment_version || "",
      rushed: Array.isArray(q.flags) && q.flags.some(f => f === "possible_straight_line" || f === "too_fast"),
      reset: x.reset_started ? Math.min(7, Number(x.reset_days) || 0) : null
    };
  });
  const since = d => out.filter(x => Date.now() - Date.parse((x.date || "").replace(" ", "T") + (/(Z|[+-]\d\d:?\d\d)$/.test(x.date || "") ? "" : "Z")) < d * 86400000).length;
  const count = key => out.reduce((m, x) => (m[x[key] || "direct"] = (m[x[key] || "direct"] || 0) + 1, m), {});
  // Anonymous funnel: everyone who started and finished, saved or not.
  let funnel = null;
  try {
    const f = (await env.DB.prepare(
      `SELECT kind, source, primary_pattern, rushed, created_at FROM assessment_events ORDER BY id DESC LIMIT 5000`
    ).all()).results || [];
    const recent = (x, days) => Date.now() - Date.parse(x.created_at) < days * 86400000;
    const fin = f.filter(x => x.kind === "finish"), st = f.filter(x => x.kind === "start");
    const tally = (list, key, map) => list.reduce((m, x) => { const k = map ? map(x[key]) : (x[key] || "direct"); m[k] = (m[k] || 0) + 1; return m; }, {});
    funnel = {
      started: st.length, finished: fin.length, startedToday: st.filter(x => recent(x, 1)).length, finishedToday: fin.filter(x => recent(x, 1)).length,
      started7: st.filter(x => recent(x, 7)).length, finished7: fin.filter(x => recent(x, 7)).length, rushed: fin.filter(x => x.rushed).length,
      finishedBySource: tally(fin, "source"), finishedByPattern: tally(fin, "primary_pattern", title),
      since: f.length ? f[f.length - 1].created_at : null
    };
    const t0 = funnel.since ? Date.parse(funnel.since) : Infinity;
    funnel.saved = out.filter(x => Date.parse((x.date || "").replace(" ", "T") + (/(Z|[+-]\d\d:?\d\d)$/.test(x.date || "") ? "" : "Z")) >= t0).length;
  } catch (e) { /* counter table not created yet */ }
  return Response.json({
    success: true, funnel,
    summary: { total: out.length, last7: since(7), today: since(1), startedReset: out.filter(x => x.reset !== null).length, bySource: count("source"), byPattern: count("pattern") },
    rows: out
  });
}

// Anonymous counter: POST /api/assessment/event {kind:"start"|"finish", ...}. No name, email or answers.
export async function handleAssessmentEvent(request, env) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  let d = {}; try { d = await request.json(); } catch (e) {}
  const kind = d && (d.kind === "start" || d.kind === "finish") ? d.kind : null;
  if (!kind) return Response.json({ success: false }, { status: 400 });
  const pat = k => (k && Object.prototype.hasOwnProperty.call(PATTERN_TITLES, k) ? k : null);
  const int = (v, lo, hi) => (Number.isFinite(Number(v)) && Number(v) >= lo && Number(v) <= hi ? Math.round(Number(v)) : null);
  const source = String(d.source || "direct").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30) || "direct";
  try {
    await env.DB.prepare(
      "INSERT INTO assessment_events (created_at, kind, version, primary_pattern, secondary_pattern, overall_score, source, rushed, seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(new Date().toISOString(), kind, String(d.version || "").slice(0, 10), kind === "finish" ? pat(d.pattern) : null, kind === "finish" ? pat(d.secondary) : null,
      kind === "finish" ? int(d.score, 0, 100) : null, source, d.rushed ? 1 : 0, kind === "finish" ? int(d.seconds, 0, 86400) : null).run();
  } catch (e) { return Response.json({ success: false }, { status: 500 }); }
  return Response.json({ success: true });
}

// Phone alert when someone saves their result (only when NTFY_TOPIC is set).
export function alertNewResult(env, origin, name, pattern, source) {
  return notifyJosh(env, {
    title: "New Mind Alignment result",
    message: firstName(name) + " completed the Mind Alignment Index: " + (title(pattern) || "result saved") + (source ? " (came from " + source + ")" : "") + ".",
    click: origin + "/results-admin", tags: "seedling"
  });
}
