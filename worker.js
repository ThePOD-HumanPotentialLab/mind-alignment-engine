export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API: save a completed Mind Alignment profile
    if (url.pathname === "/api/save-profile") {
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

        if (
          !name ||
          !email ||
          !Number.isFinite(overallScore) ||
          !dimensionScores ||
          !answers
        ) {
          return Response.json(
            { success: false, error: "Incomplete profile data." },
            { status: 400 }
          );
        }

        const result = await env.DB.prepare(`
          INSERT INTO assessment_results
          (name, email, overall_score, dimension_scores, answers)
          VALUES (?, ?, ?, ?, ?)
        `)
          .bind(
            name,
            email,
            Math.round(overallScore),
            JSON.stringify(dimensionScores),
            JSON.stringify(answers)
          )
          .run();

        return Response.json({
          success: true,
          id: result.meta.last_row_id
        });
      } catch (error) {
        return Response.json(
          {
            success: false,
            error: "Unable to save profile."
          },
          { status: 500 }
        );
      }
    }

    // Everything else: serve the existing assessment website
    return env.ASSETS.fetch(request);
  }
};
