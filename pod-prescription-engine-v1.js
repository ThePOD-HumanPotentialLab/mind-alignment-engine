/**
 * POD Mind Alignment Engine — Development Prescription Engine V1
 * Intended integration target: Mind Alignment Index V2 result experience.
 *
 * Design:
 * Primary pattern -> one development objective -> one practice -> evidence -> product path.
 * Secondary pattern modifies the prescription; it does not replace the primary pattern.
 */

const PRESCRIPTIONS = {
  visionExecution: {
    product: "Personal Optimization Drill (POD)",
    stage: "Activation",
    objective: "Translate intention and direction into repeatable execution.",
    practice: "Choose one priority, define one outcome and one next action; add an If–Then plan for the main obstacle.",
    evidence: "The intended behaviour occurs consistently in the chosen 7-day window.",
    metric: "Execution consistency: completed days / 7.",
    reason: "Your direction may currently be stronger than the behavioural system translating it into daily action."
  },

  identityExecution: {
    product: "Personal Optimization Drill (POD)",
    stage: "Activation",
    objective: "Create behavioural evidence for the identity you are building.",
    practice: "Choose one identity-linked behaviour and make it specific, visible and repeatable for 7 days.",
    evidence: "The chosen behaviour is completed on at least 5 of 7 days.",
    metric: "Identity-behaviour completion: days completed / 7.",
    reason: "The person you believe you are becoming may currently be ahead of the routines that consistently express that identity."
  },

  emotionalOverride: {
    product: "Personal Optimization Drill (POD)",
    stage: "Activation",
    objective: "Create space between emotional activation and chosen response.",
    practice: "Use Trigger → Pause → Name → Regulate → Choose in five activating moments.",
    evidence: "More situations end in a deliberate response rather than an immediate reaction.",
    metric: "Regulation events logged / 5.",
    reason: "Your cognitive understanding may currently be stronger than your ability to respond deliberately under emotional activation."
  },

  agencyAction: {
    product: "Personal Optimization Drill (POD)",
    stage: "Activation",
    objective: "Convert recognition of influence into controllable action.",
    practice: "For each important problem, identify what is yours to influence and complete one next action within 24 hours.",
    evidence: "At least five controllable actions are completed during the 7-day period.",
    metric: "Controllable actions completed.",
    reason: "Recognizing your influence may currently be stronger than consistently converting that recognition into action."
  },

  relationalAdaptation: {
    product: "Personal Optimization Drill (POD)",
    stage: "Activation",
    objective: "Preserve authenticity while maintaining connection.",
    practice: "Use Need → Value → Boundary → Request in three low-risk conversations.",
    evidence: "The person expresses a relevant need, value or boundary without unnecessary withdrawal or conflict.",
    metric: "Authentic expressions / 3.",
    reason: "Maintaining relational harmony may sometimes take precedence over expressing your own direction and priorities."
  },

  fragmentedDirection: {
    product: "Personal Optimization Drill (POD)",
    stage: "Activation",
    objective: "Create coherent direction and reduce competing priorities.",
    practice: "Choose one 30-day direction, three priorities and one next action each day.",
    evidence: "Fewer priority switches and clearer daily decisions.",
    metric: "Daily next-action completion; priority switches per week.",
    reason: "Different areas of your profile may be developing at different speeds while your larger direction is not yet sufficiently defined."
  },

  expansionReadiness: {
    product: "MAP",
    stage: "Development",
    objective: "Convert alignment into deliberate capability expansion.",
    practice: "Choose one meaningful stretch capability and practise it five times in seven days.",
    evidence: "New capability evidence appears through deliberate practice and feedback.",
    metric: "Stretch practices completed / 5.",
    reason: "Your profile suggests a strong developmental foundation. The opportunity is expansion through challenge, practice and capability development."
  },

  integrated: {
    product: "Personal Optimization Drill (POD)",
    stage: "Refinement",
    objective: "Strengthen the next leverage point without destabilizing existing alignment.",
    practice: "Choose the most strategically relevant dimension and complete five targeted practices in seven days.",
    evidence: "The selected leverage area shows consistent practice and measurable movement on reassessment.",
    metric: "Targeted practices completed / 5; reassessment change.",
    reason: "No dominant gap pattern is detected. The opportunity is refinement rather than repair."
  }
};

const SECONDARY_MODIFIERS = {
  visionExecution: "Add a simple execution system: when, where and how the behaviour will happen.",
  identityExecution: "Connect the practice explicitly to the identity the person is building.",
  emotionalOverride: "Add a pause-and-regulate step before the primary behaviour.",
  agencyAction: "Frame the practice around the next controllable action.",
  relationalAdaptation: "Add an authenticity, boundary or direct-communication component.",
  fragmentedDirection: "Reduce competing priorities before adding new commitments.",
  expansionReadiness: "Preserve the expansion frame; do not turn the development opportunity into a deficit narrative.",
  integrated: "Use the lowest strategically relevant dimension only as a refinement target."
};

function getDevelopmentPrescription(result) {
  const key = result?.primaryPattern || "integrated";
  const base = PRESCRIPTIONS[key] || PRESCRIPTIONS.integrated;
  const secondary = result?.secondaryPattern || null;

  return {
    ...base,
    primaryPattern: key,
    secondaryPattern: secondary,
    secondaryModifier: secondary ? SECONDARY_MODIFIERS[secondary] : null,
    pathway: base.product === "MAP"
      ? "Mind Alignment & Human Potential development"
      : "Personal Optimization Drill → MAP when deeper development is indicated",
    caution: result?.quality?.flags?.length
      ? "Response-quality flags are present. Treat this result as a developmental indicator and consider reassessment before making a strong intervention decision."
      : "Developmental interpretation only; not a clinical diagnosis."
  };
}

function buildResultExperience(result) {
  const p = getDevelopmentPrescription(result);

  return {
    headline: `Your next development opportunity is ${p.objective.toLowerCase()}`,
    pattern: p.primaryPattern,
    developmentObjective: p.objective,
    practice: p.practice,
    evidence: p.evidence,
    metric: p.metric,
    recommendedProduct: p.product,
    stage: p.stage,
    reason: p.reason,
    secondaryModifier: p.secondaryModifier,
    pathway: p.pathway,
    caution: p.caution
  };
}

if (typeof window !== "undefined") {
  window.PODPrescriptionEngine = {
    PRESCRIPTIONS,
    SECONDARY_MODIFIERS,
    getDevelopmentPrescription,
    buildResultExperience
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    PRESCRIPTIONS,
    SECONDARY_MODIFIERS,
    getDevelopmentPrescription,
    buildResultExperience
  };
}
