/**
 * POD Mind Alignment Engine — Human-Centered Development Prescription Engine
 * Version 2.3.0
 *
 * Logic only.
 * Participant-facing content lives in prescriptions.js.
 *
 * Thesis:
 * mind → meaning → response → behaviour → evidence → development.
 */

"use strict";

const ENGINE_VERSION = "2.3.0";
const FALLBACK_KEY = "integrated";

const REQUIRED_FIELDS = [
  "title",
  "product",
  "stage",
  "headline",
  "whatThisMeans",
  "whyItMatters",
  "mindsetShift",
  "developmentFocus",
  "experiment",
  "reflection",
  "evidence",
  "pathway",
  "metric",
  "metricTarget",
  "reason"
];

const CAUTION_DEFAULT =
  "This is a developmental interpretation of your response pattern, not a clinical diagnosis. " +
  "It is a snapshot: patterns can shift with practice, so revisit it after a few weeks.";

const CAUTION_QUALITY_FLAG =
  "Your response pattern includes a quality flag. Treat this result as a developmental indicator " +
  "and consider reassessment before making a major development decision.";


/**
 * Deep-freeze an object so participant-facing prescription data
 * cannot be accidentally modified by the UI.
 */
function deepFreeze(obj) {
  if (!obj || typeof obj !== "object" || Object.isFrozen(obj)) {
    return obj;
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}


/**
 * Safely merge per-pattern overrides onto the canonical prescription data.
 *
 * This is useful for QA and future copy experiments without modifying
 * the canonical prescriptions.js file.
 */
function withOverrides(data, overrides = {}) {
  const PRESCRIPTIONS = {};

  for (const [key, base] of Object.entries(data.PRESCRIPTIONS)) {
    PRESCRIPTIONS[key] = {
      ...base,
      ...(overrides[key] || {})
    };
  }

  return {
    PRESCRIPTIONS,
    SECONDARY_MODIFIERS: {
      ...data.SECONDARY_MODIFIERS
    }
  };
}


/**
 * Validate the prescription data structure.
 *
 * Returns an array of human-readable problems.
 * An empty array means the data passes validation.
 */
function validateData({
  PRESCRIPTIONS,
  SECONDARY_MODIFIERS
}) {
  const problems = [];

  if (!PRESCRIPTIONS || typeof PRESCRIPTIONS !== "object") {
    problems.push("PRESCRIPTIONS is missing or invalid.");
    return problems;
  }

  if (!SECONDARY_MODIFIERS || typeof SECONDARY_MODIFIERS !== "object") {
    problems.push("SECONDARY_MODIFIERS is missing or invalid.");
    return problems;
  }

  if (!Object.hasOwn(PRESCRIPTIONS, FALLBACK_KEY)) {
    problems.push(
      `Missing fallback prescription "${FALLBACK_KEY}".`
    );
  }

  for (const [key, prescription] of Object.entries(PRESCRIPTIONS)) {

    for (const field of REQUIRED_FIELDS) {
      if (
        typeof prescription[field] !== "string" ||
        prescription[field].trim() === ""
      ) {
        problems.push(
          `PRESCRIPTIONS.${key}.${field} is missing or empty.`
        );
      }
    }

    if (!Object.hasOwn(SECONDARY_MODIFIERS, key)) {
      problems.push(
        `SECONDARY_MODIFIERS has no entry for "${key}".`
      );
    }
  }

  for (const key of Object.keys(SECONDARY_MODIFIERS)) {
    if (!Object.hasOwn(PRESCRIPTIONS, key)) {
      problems.push(
        `SECONDARY_MODIFIERS.${key} has no matching prescription.`
      );
    }
  }

  return problems;
}


/**
 * Create the live prescription engine from the canonical data.
 */
function createEngine(data, { strict = false } = {}) {

  const problems = validateData(data);

  if (problems.length) {

    const message =
      `PODPrescriptionEngine data problems:\n - ${problems.join("\n - ")}`;

    if (strict) {
      throw new Error(message);
    }

    if (typeof console !== "undefined") {
      console.warn(message);
    }
  }


  /*
   * Clone before freezing so the original data object is not mutated.
   */
  const PRESCRIPTIONS = deepFreeze(
    typeof structuredClone === "function"
      ? structuredClone(data.PRESCRIPTIONS)
      : JSON.parse(JSON.stringify(data.PRESCRIPTIONS))
  );

  const SECONDARY_MODIFIERS = deepFreeze({
    ...data.SECONDARY_MODIFIERS
  });


  /**
   * Select the prescription corresponding to the primary pattern.
   */
  function getDevelopmentPrescription(result) {

    const requested = result?.primaryPattern;

    const known =
      typeof requested === "string" &&
      Object.hasOwn(PRESCRIPTIONS, requested);

    const key = known
      ? requested
      : FALLBACK_KEY;

    const base = PRESCRIPTIONS[key];


    /*
     * If the scoring layer supplies an invalid pattern,
     * fall back safely but explicitly record that this happened.
     */
    if (!known && typeof console !== "undefined") {
      console.warn(
        `PODPrescriptionEngine: unknown or missing primaryPattern ` +
        `(${String(requested)}); using "${FALLBACK_KEY}".`
      );
    }


    /*
     * Secondary pattern must:
     * 1. be a string
     * 2. exist in the modifier library
     * 3. not be identical to the primary pattern
     */
    const candidate = result?.secondaryPattern;

    const secondary =
      typeof candidate === "string" &&
      candidate !== key &&
      Object.hasOwn(SECONDARY_MODIFIERS, candidate)
        ? candidate
        : null;


    const hasQualityFlag =
      Array.isArray(result?.quality?.flags) &&
      result.quality.flags.length > 0;


    return {
      ...base,

      primaryPattern: key,

      secondaryPattern: secondary,

      secondaryModifier:
        secondary
          ? SECONDARY_MODIFIERS[secondary]
          : null,

      caution:
        hasQualityFlag
          ? CAUTION_QUALITY_FLAG
          : CAUTION_DEFAULT,

      fallbackUsed: !known,

      engineVersion: ENGINE_VERSION
    };
  }


  /**
   * Build the complete participant-facing result experience.
   */
  function buildResultExperience(result) {

    const prescription =
      getDevelopmentPrescription(result);


    return {

      headline:
        prescription.headline,

      title:
        prescription.title,

      pattern:
        prescription.primaryPattern,

      whatThisMeans:
        prescription.whatThisMeans,

      whyItMatters:
        prescription.whyItMatters,

      mindsetShift:
        prescription.mindsetShift,

      developmentFocus:
        prescription.developmentFocus,

      experiment:
        prescription.experiment,

      reflection:
        prescription.reflection,

      evidence:
        prescription.evidence,

      metric:
        prescription.metric,

      metricTarget:
        prescription.metricTarget,

      recommendedProduct:
        prescription.product,

      stage:
        prescription.stage,

      reason:
        prescription.reason,

      secondaryModifier:
        prescription.secondaryModifier,

      pathway:
        prescription.pathway,

      caution:
        prescription.caution,

      fallbackUsed:
        prescription.fallbackUsed,

      engineVersion:
        prescription.engineVersion
    };
  }


  return {
    PRESCRIPTIONS,
    SECONDARY_MODIFIERS,
    getDevelopmentPrescription,
    buildResultExperience
  };
}


/*
 * Public engine API.
 */
const api = {
  ENGINE_VERSION,
  REQUIRED_FIELDS,
  createEngine,
  withOverrides,
  validateData
};


/*
 * Browser implementation.
 *
 * prescriptions.js must be loaded BEFORE engine.js.
 */
if (typeof window !== "undefined") {

  window.PODPrescriptionEngine = {
    ...api,

    ...(window.PODPrescriptionData
      ? createEngine(window.PODPrescriptionData)
      : {})
  };
}


/*
 * Node / test implementation.
 *
 * This allows automated QA to load the same engine against
 * the same prescription data used by the application.
 */
if (
  typeof module !== "undefined" &&
  module.exports
) {

  const data = require("./prescriptions");

  module.exports = {
    ...api,
    ...createEngine(data, { strict: true })
  };
}
