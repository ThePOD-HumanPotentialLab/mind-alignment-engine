const LAGOS_OFFSET_MS = 60 * 60 * 1000; // Programme days follow Africa/Lagos time (UTC+1)

function lagosDate(ms) {
  return new Date(ms + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

function json(body, status = 200) {
  return Response.json(body, { status });
}

function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

async function getParticipant(env, token) {
  if (!token || typeof token !== "string" || token.length > 100) return null;
  return env.DB.prepare("SELECT id, name FROM reset_participants WHERE token = ?")
    .bind(token).first();
}

async function getProgress(env, participantId) {
  const { results } = await env.DB.prepare(
    "SELECT day, completed_date FROM reset_progress WHERE participant_id = ? ORDER BY day"
  ).bind(participantId).all();
  return results.map(r => ({ day: r.day, completedOn: r.completed_date }));
}

async function handleSaveProfile(request, env) {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const data = await request.json();
    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const overallScore = Number(data.overallScore);
    const dimensionScores = data.dimensionScores;
    const answers = data.answers;

    const recommendedProduct = String(data.recommendedProduct || "").trim();
    const recommendationStage = String(data.recommendationStage || "").trim();
    const recommendationReason = String(data.recommendationReason || "").trim();
    const recommendationCTA = String(data.recommendationCTA || "").trim();

    if (!name || !email || !Number.isFinite(overallScore) || !dimensionScores || !answers) {
      return json({ success: false, error: "Incomplete profile data." }, 400);
    }

    const result = await env.DB.prepare(`
      INSERT INTO assessment_results (
        name, email, overall_score, dimension_scores, answers, assessment_version,
        raw_dimension_scores, profile_mean, profile_sd, dimension_deviations, gaps,
        primary_pattern, secondary_pattern, response_quality,
        recommended_product, recommendation_stage, recommendation_reason, recommendation_cta
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name,
      email,
      Math.round(overallScore),
      JSON.stringify(dimensionScores),
      JSON.stringify(answers),
      String(data.assessmentVersion || "1.0"),
      JSON.stringify(data.rawDimensionScores || null),
      data.profileMean == null ? null : Number(data.profileMean),
      data.profileSD == null ? null : Number(data.profileSD),
      JSON.stringify(data.dimensionDeviations || null),
      JSON.stringify(data.gaps || null),
      data.primaryPattern ? String(data.primaryPattern) : null,
      data.secondaryPattern ? String(data.secondaryPattern) : null,
      JSON.stringify(data.responseQuality || null),
      recommendedProduct,
      recommendationStage,
      recommendationReason,
      recommendationCTA
    ).run();

    return json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    return json({ success: false, error: "Unable to save profile." }, 500);
  }
}

/* ---------------- 7-Day Mind Reset ---------------- */

async function handleResetStart(request, env) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const data = await readJson(request);
  const name = String(data?.name || "").trim().slice(0, 100);
  const email = String(data?.email || "").trim().toLowerCase().slice(0, 200);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: "Please enter your name and a valid email address." }, 400);
  }

  try {
    let participant = await env.DB.prepare(
      "SELECT id, name, token FROM reset_participants WHERE email = ?"
    ).bind(email).first();

    if (!participant) {
      const token = newToken();
      const result = await env.DB.prepare(
        "INSERT INTO reset_participants (name, email, token, started_at) VALUES (?, ?, ?, ?)"
      ).bind(name, email, token, new Date().toISOString()).run();
      participant = { id: result.meta.last_row_id, name, token };
    }

    return json({
      success: true,
      token: participant.token,
      name: participant.name,
      today: lagosDate(Date.now()),
      progress: await getProgress(env, participant.id)
    });
  } catch (error) {
    return json({ success: false, error: "We could not start your Reset right now. Please try again." }, 500);
  }
}

async function handleResetProgress(request, env) {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
  const token = new URL(request.url).searchParams.get("token");
  try {
    const participant = await getParticipant(env, token);
    if (!participant) return json({ success: false, error: "Not found." }, 404);
    return json({
      success: true,
      name: participant.name,
      today: lagosDate(Date.now()),
      progress: await getProgress(env, participant.id)
    });
  } catch (error) {
    return json({ success: false, error: "Unable to load progress." }, 500);
  }
}

async function handleResetComplete(request, env) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const data = await readJson(request);
  const day = Number(data?.day);
  const reflection = String(data?.reflection || "").trim().slice(0, 4000);

  if (!Number.isInteger(day) || day < 1 || day > 7) {
    return json({ success: false, error: "Invalid day." }, 400);
  }

  try {
    const participant = await getParticipant(env, data?.token);
    if (!participant) return json({ success: false, error: "Please start your Reset again." }, 404);

    const progress = await getProgress(env, participant.id);
    const today = lagosDate(Date.now());

    if (progress.some(p => p.day === day)) {
      return json({ success: true, alreadyCompleted: true, today, progress });
    }

    if (day > 1) {
      const previous = progress.find(p => p.day === day - 1);
      if (!previous) {
        return json({ success: false, error: `Please complete Day ${day - 1} first.` }, 409);
      }
      if (previous.completedOn >= today) {
        return json({ success: false, error: `Day ${day} opens tomorrow.` }, 409);
      }
    }

    await env.DB.prepare(
      "INSERT INTO reset_progress (participant_id, day, reflection, completed_at, completed_date) VALUES (?, ?, ?, ?, ?)"
    ).bind(participant.id, day, reflection, new Date().toISOString(), today).run();

    return json({ success: true, today, progress: await getProgress(env, participant.id) });
  } catch (error) {
    return json({ success: false, error: "We could not save today's progress. Please try again." }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/api/save-profile": return handleSaveProfile(request, env);
      case "/api/reset/start": return handleResetStart(request, env);
      case "/api/reset/progress": return handleResetProgress(request, env);
      case "/api/reset/complete": return handleResetComplete(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ success: false, error: "Not found." }, 404);
    }

    return env.ASSETS.fetch(request);
  }
};
