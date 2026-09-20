export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
        
        const recommendedProduct = String(data.recommendedProduct || "").trim();
const recommendationStage = String(data.recommendationStage || "").trim();
const recommendationReason = String(data.recommendationReason || "").trim();
const recommendationCTA = String(data.recommendationCTA || "").trim();

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
          (
            name,
            email,
            overall_score,
            dimension_scores,
            answers,
            assessment_version,
            raw_dimension_scores,
            profile_mean,
            profile_sd,
            dimension_deviations,
            gaps,
            primary_pattern,
            secondary_pattern,
            response_quality
            recommended_product,
recommendation_stage,
recommendation_reason,
recommendation_cta
          )
          VALUES VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(
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

    return env.ASSETS.fetch(request);
  }
};
