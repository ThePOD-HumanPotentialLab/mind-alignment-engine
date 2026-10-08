(function (factory) {
  const data = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = data;
  }

  if (typeof window !== "undefined") {
    window.PODPrescriptionData = data;
  }
})(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * Shared constants
   * ------------------------------------------------------------------ */

  const PARTICIPANT_FOOTER =
    "This is a developmental reflection, not a clinical diagnosis.";

  const PRODUCT_NAMES = {
    pod: "Personal Optimization Drill (POD)",
    map: "Mind Alignment & Human Potential Program (MAHPP)"
  };

  /* ------------------------------------------------------------------ *
   * Source definitions
   *
   * Each pattern is written ONCE here. buildPrescription() expands it into
   * the full set of properties the front end already reads, so the aliases
   * (focus / headline / developmentFocus, metric / experiment, etc.) can
   * never drift apart.
   *
   *   focus        -> focus, headline, developmentFocus
   *   practice     -> practice (the example is appended automatically)
   *   success      -> successSignal (and evidence, unless overridden)
   *   evidence     -> optional shorter variant of success
   *   next         -> nextStep and pathway (built from PRODUCT_NAMES.map)
   *   experiment   -> experiment (and metric, unless overridden)
   *   metric       -> optional override of experiment
   * ------------------------------------------------------------------ */

  const DEFINITIONS = {

    visionExecution: {
      title: "Turning intention into action",
      product: "pod",
      stage: "Activation",
      focus: "Turn one important intention into consistent action.",
      practice:
        "In the next seven days, choose one outcome that matters to you and complete one specific action toward it on five days.",
      example:
        "I will spend 30 minutes on this project at 9 a.m. before I start anything else.",
      success:
        "You can point to five days when your chosen action actually happened, even when other demands competed for your attention.",
      evidence:
        "You can point to five days when your chosen action actually happened.",
      next: {
        want: "to build a stronger and more lasting system around this",
        close: "is an option for going deeper"
      },
      whatThisMeans:
        "You may have a clear sense of what you want, and you can strengthen the connection between that intention and what you do each day.",
      whyItMatters:
        "An intention becomes more powerful when it is expressed through repeated action.",
      mindsetShift:
        "You do not need to change everything at once. Start with one meaningful action and make it repeatable.",
      experiment: "Complete the chosen action on five of seven days.",
      metricTarget: "5 of 7 days.",
      reflection:
        "What did I do today that moved an important intention into action?",
      reason:
        "Your profile suggests an opportunity to strengthen the connection between intention and consistent action."
    },

    identityExecution: {
      title: "Expressing who you are becoming",
      product: "pod",
      stage: "Activation",
      focus:
        "Let the way you act give you stronger evidence of who you are becoming.",
      practice:
        "For the next seven days, choose one behaviour that reflects the person you want to be and practise it on five days.",
      example:
        "I am someone who keeps my word, so I will reply to every message I promised to answer before I finish work today.",
      success:
        "You can identify five occasions when your behaviour clearly reflected the identity you are building.",
      next: {
        want: "to explore the deeper beliefs and patterns behind this",
        close: "is an option for going further"
      },
      whatThisMeans:
        "You can strengthen the connection between the identity you are building and the behaviours you repeat.",
      whyItMatters:
        "Identity becomes stronger when your everyday choices give you repeated evidence of who you are becoming.",
      mindsetShift:
        "Start by practising one behaviour that reflects who you want to be.",
      experiment:
        "Practise one identity-linked behaviour on five of seven days.",
      metric:
        "Demonstrate the chosen identity-linked behaviour on five of seven days.",
      metricTarget: "5 of 7 days.",
      reflection:
        "What did I do today that reflected the person I am becoming?",
      reason:
        "Your profile suggests an opportunity to strengthen the connection between identity and repeated behaviour."
    },

    emotionalOverride: {
      title: "Creating space before you respond",
      product: "pod",
      stage: "Activation",
      focus:
        "Create enough space between what you feel and what you choose to do next.",
      practice:
        "Over the next seven days, notice at least three emotionally charged moments. Pause before responding, name what you are feeling, and then deliberately choose your response.",
      example:
        "I can feel frustration rising. I will take one breath, name it, and then decide how to reply.",
      success:
        "You notice the emotional shift earlier, pause before reacting, and deliberately choose your response at least three times.",
      evidence: "You deliberately choose your response at least three times.",
      next: {
        want: "to develop this capacity more deeply",
        close: "is an option"
      },
      whatThisMeans:
        "You can strengthen your ability to remain intentional when emotions become strong.",
      whyItMatters:
        "Emotion can give you useful information without having to determine what you do next.",
      mindsetShift:
        "The goal is not to become emotionless. The goal is to stay present and intentional while emotion is present.",
      experiment:
        "Notice, pause and choose deliberately in at least three emotionally charged moments.",
      metric:
        "Notice, pause and choose deliberately in at least three emotionally charged moments within seven days.",
      metricTarget: "3 or more moments in 7 days.",
      reflection: "Did I respond from intention, or did I react from the moment?",
      reason:
        "Your profile suggests an opportunity to strengthen the space between emotional activation and deliberate response."
    },

    agencyAction: {
      title: "Turning influence into action",
      product: "pod",
      stage: "Activation",
      focus:
        "Turn your awareness of what you can influence into clear, deliberate action.",
      practice:
        "For the next seven days, identify one thing you can genuinely influence each day and take one meaningful action within 24 hours.",
      example:
        "I cannot control when the client replies, but I can send the revised proposal by 4 p.m. today.",
      success:
        "You can point to at least five meaningful actions you took instead of remaining focused on what was outside your control.",
      evidence:
        "You can point to at least five meaningful actions where your choices made a difference.",
      next: {
        want: "to strengthen this further across identity, mindset and execution",
        close: "is an option"
      },
      whatThisMeans:
        "You can strengthen the connection between knowing what you can influence and acting on it.",
      whyItMatters:
        "Awareness creates possibility. Action creates evidence and movement.",
      mindsetShift: "Focus on what is genuinely yours to move now.",
      experiment:
        "Complete one meaningful controllable action on at least five of seven days.",
      metricTarget: "5 of 7 days.",
      reflection: "What is mine to do now?",
      reason:
        "Your profile suggests an opportunity to turn awareness of personal influence into more consistent action."
    },

    relationalAdaptation: {
      title: "Staying true to yourself while staying connected",
      product: "pod",
      stage: "Activation",
      focus:
        "Stay true to what matters to you while keeping your relationships strong.",
      practice:
        "In three low-stakes conversations this week, say clearly what you need, why it matters, where your limit is, and what you are asking for.",
      example:
        "I need more notice on deadlines. It helps me do my best work. I can't take on last-minute changes, so could we agree on 48 hours?",
      success:
        "You can say what you need without going quiet, over-explaining, or turning the conversation into conflict.",
      evidence:
        "You can express what you need clearly in three conversations.",
      next: {
        want:
          "to explore this more deeply through identity, relationships and leadership",
        close: "is an option"
      },
      whatThisMeans:
        "You may be highly attentive to other people, and you can strengthen your ability to make room for your own needs and priorities too.",
      whyItMatters:
        "Strong relationships can include honesty, clear boundaries and genuine connection at the same time.",
      mindsetShift:
        "You can be clear about what matters to you while remaining respectful and connected.",
      experiment:
        "Have three low-stakes conversations and practise clear, authentic expression in each.",
      metricTarget: "3 conversations.",
      reflection:
        "What did I make room for in the relationship without making myself smaller?",
      reason:
        "Your profile suggests an opportunity to strengthen authentic expression while maintaining connection."
    },

    fragmentedDirection: {
      title: "Creating clearer direction",
      product: "pod",
      stage: "Activation",
      focus: "Create enough clarity to know what matters most right now.",
      practice:
        "Choose one meaningful direction for the next 30 days, identify three priorities that support it, and choose one next action each morning.",
      example:
        "My direction for the next 30 days is to launch the pilot. Today's next action is to draft the invitation list.",
      success:
        "Your daily choices become easier to make and your actions repeatedly support the direction you chose.",
      evidence:
        "Your daily choices repeatedly support the direction you chose.",
      next: {
        want:
          "to work more deeply on direction, identity and long-term alignment",
        close: "is an option"
      },
      whatThisMeans:
        "You can strengthen your ability to let one clear direction organize your attention and choices.",
      whyItMatters:
        "When too many priorities compete for attention, it becomes harder to create meaningful movement.",
      mindsetShift: "You need enough clarity to know what matters most right now.",
      experiment:
        "Let your chosen direction guide the day's priority and next action on at least five of seven days.",
      metricTarget: "5 of 7 days.",
      reflection:
        "Is what I am doing today helping the direction I have chosen, or competing with it?",
      reason:
        "Your profile suggests an opportunity to create greater clarity and coherence around direction and priorities."
    },

    expansionReadiness: {
      title: "Expanding what you are capable of",
      product: "map",
      stage: "Development",
      focus:
        "Turn your current alignment into a capability you can use at a higher level.",
      practice:
        "Choose one meaningful capability that would expand what you can create, lead or contribute, and practise it five times over the next seven days.",
      example:
        "I will present my idea in tomorrow's meeting and ask two colleagues for one piece of honest feedback afterwards.",
      success:
        "You can point to at least four deliberate attempts and identify what each attempt taught you.",
      next: {
        want: "to continue expanding your range and capability",
        close: "is the natural place to begin"
      },
      whatThisMeans:
        "Your profile gives you a strong foundation for using deliberate challenge and practice to expand what you can create, lead and contribute.",
      whyItMatters:
        "Growth can move beyond fixing gaps and toward expanding what you are capable of becoming and doing.",
      mindsetShift:
        "You can grow through deliberate challenge, practice and feedback.",
      experiment:
        "Complete at least four of five deliberate stretch practices within seven days.",
      metricTarget: "4 of 5 practices.",
      reflection:
        "What could become possible if I deliberately developed the capability I am currently underusing?",
      reason:
        "Your profile suggests a strong developmental foundation and an opportunity to expand capability through challenge, practice and feedback."
    },

    integrated: {
      title: "Strengthening your next leverage point",
      product: "pod",
      stage: "Refinement",
      focus:
        "Strengthen the area that could create the greatest positive difference in your life right now.",
      practice:
        "Choose one area you want to strengthen and complete five targeted practices over the next seven days.",
      example:
        "I will use five 20-minute sessions this week to strengthen how I plan my day.",
      success:
        "The area you chose becomes more consistent, and you can point to at least four completed practices that moved it forward.",
      evidence:
        "You can point to at least four completed practices that moved the chosen area forward.",
      next: {
        want: "to build on this foundation through deeper and sustained development",
        close: "is an option"
      },
      whatThisMeans:
        "Your profile does not point to one dominant pattern. You can use that foundation to strengthen one area that would create meaningful leverage.",
      whyItMatters:
        "Development is not only about fixing weaknesses. Sometimes the next step is learning how to use what is already working more deliberately.",
      mindsetShift:
        "Build on what is already working and strengthen one meaningful area.",
      experiment:
        "Complete at least four of five targeted practices within seven days.",
      metricTarget: "4 of 5 practices.",
      reflection:
        "What small change would make my existing strengths more useful in the life I am building?",
      reason:
        "No dominant pattern is detected. The opportunity is refinement and leverage rather than repair."
    }
  };

  /* ------------------------------------------------------------------ *
   * Builder: one definition -> the full property set the UI reads
   * ------------------------------------------------------------------ */

  function buildPrescription(id, d) {
    const productName = PRODUCT_NAMES[d.product];
    if (!productName) {
      throw new Error(`Unknown product key "${d.product}" in pattern "${id}"`);
    }

    const pathway = `${PRODUCT_NAMES.map} ${d.next.close}.`;

    return {
      id,
      title: d.title,
      product: productName,
      productFullName: productName,
      stage: d.stage,

      // Participant-facing block
      focus: d.focus,
      practice: d.example
        ? `${d.practice} For example: "${d.example}"`
        : d.practice,
      example: d.example || "",
      successSignal: d.success,
      nextStep: `If you want ${d.next.want}, the ${PRODUCT_NAMES.map} ${d.next.close}.`,
      footer: PARTICIPANT_FOOTER,

      // Extended fields (aliases kept for backward compatibility)
      headline: d.focus,
      whatThisMeans: d.whatThisMeans,
      whyItMatters: d.whyItMatters,
      mindsetShift: d.mindsetShift,
      developmentFocus: d.focus,
      experiment: d.experiment,
      reflection: d.reflection,
      evidence: d.evidence || d.success,
      pathway,
      metric: d.metric || d.experiment,
      metricTarget: d.metricTarget,
      reason: d.reason
    };
  }

  /* ------------------------------------------------------------------ *
   * Secondary modifiers
   * NOTE: these read as instructions to the engine, not to the participant.
   * Do not render them directly on the results page.
   * ------------------------------------------------------------------ */

  const SECONDARY_MODIFIERS = {
    visionExecution:
      "Keep the primary focus practical: connect the insight to a specific time, place and action.",
    identityExecution:
      "Keep the development practice connected to the identity you are building.",
    emotionalOverride:
      "Before the primary practice, create a deliberate pause so emotion can be noticed without automatically directing the response.",
    agencyAction:
      "Keep bringing the focus back to the next action that is genuinely within your control or influence.",
    relationalAdaptation:
      "Include a small authenticity or boundary component so connection does not require you to abandon what matters to you.",
    fragmentedDirection:
      "Reduce competing priorities before adding new commitments; clarity comes before volume.",
    expansionReadiness:
      "Keep the development frame expansive. Do not turn an opportunity for growth into a story about deficiency.",
    integrated:
      "Use the most strategically relevant dimension as a refinement target rather than treating the profile as a problem to fix."
  };

  /* ------------------------------------------------------------------ *
   * Assembly
   * ------------------------------------------------------------------ */

  function deepFreeze(obj) {
    Object.keys(obj).forEach(function (key) {
      const value = obj[key];
      if (value && typeof value === "object" && !Object.isFrozen(value)) {
        deepFreeze(value);
      }
    });
    return Object.freeze(obj);
  }

  const PRESCRIPTIONS = {};
  Object.keys(DEFINITIONS).forEach(function (id) {
    PRESCRIPTIONS[id] = buildPrescription(id, DEFINITIONS[id]);
  });

  /** Fields every prescription must carry (the UI depends on these). */
  const REQUIRED_FIELDS = [
    "title", "product", "productFullName", "stage", "focus", "practice",
    "successSignal", "nextStep", "footer", "headline", "whatThisMeans",
    "whyItMatters", "mindsetShift", "developmentFocus", "experiment",
    "reflection", "evidence", "pathway", "metric", "metricTarget", "reason"
  ];

  /** Voice rules for participant-facing text. */
  const VOICE_RULES = [
    { pattern: /\bthe (participant|respondent|user)\b|\bthe person (expresses|is|has|may|shows|does|tends)\b/i,
      message: "uses third person instead of \"you\"" },
    { pattern: /\bMAP\b/,
      message: "uses the undefined acronym \"MAP\"" },
    { pattern: /\u2192|->/,
      message: "uses arrow notation in participant-facing text" }
  ];

  /**
   * Returns a list of problems (empty array = all good).
   * Run in CI via the test file, not at page load.
   */
  function validatePrescriptions(prescriptions, modifiers) {
    prescriptions = prescriptions || PRESCRIPTIONS;
    modifiers = modifiers || SECONDARY_MODIFIERS;

    const problems = [];
    const validProducts = Object.keys(PRODUCT_NAMES).map(function (k) {
      return PRODUCT_NAMES[k];
    });

    Object.keys(prescriptions).forEach(function (key) {
      const p = prescriptions[key];

      REQUIRED_FIELDS.forEach(function (field) {
        if (typeof p[field] !== "string" || !p[field].trim()) {
          problems.push(key + "." + field + " is missing or empty");
          return;
        }
        if (field === "stage") return;
        VOICE_RULES.forEach(function (rule) {
          if (rule.pattern.test(p[field])) {
            problems.push(key + "." + field + " " + rule.message);
          }
        });
      });

      if (validProducts.indexOf(p.product) === -1) {
        problems.push(key + ".product is not a known product name");
      }
      if (p.footer !== PARTICIPANT_FOOTER) {
        problems.push(key + ".footer does not match the standard disclaimer");
      }
      if (!/For example: "/.test(p.practice || "")) {
        problems.push(key + ".practice has no worked example");
      }
      if (!(key in modifiers)) {
        problems.push(key + " has no entry in SECONDARY_MODIFIERS");
      }
    });

    Object.keys(modifiers).forEach(function (key) {
      if (!(key in prescriptions)) {
        problems.push("SECONDARY_MODIFIERS has \"" + key + "\" but no prescription exists");
      }
    });

    return problems;
  }

  /** Safe lookup: falls back to "integrated" for unknown pattern keys. */
  function getPrescription(patternKey) {
    return PRESCRIPTIONS[patternKey] || PRESCRIPTIONS.integrated;
  }

  return {
    PRESCRIPTIONS: deepFreeze(PRESCRIPTIONS),
    SECONDARY_MODIFIERS: deepFreeze(SECONDARY_MODIFIERS),
    PARTICIPANT_FOOTER,
    PRODUCT_NAMES: deepFreeze(PRODUCT_NAMES),
    REQUIRED_FIELDS: deepFreeze(REQUIRED_FIELDS),
    getPrescription,
    validatePrescriptions
  };
});
