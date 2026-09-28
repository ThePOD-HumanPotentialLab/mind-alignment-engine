/**
 * POD Mind Alignment Engine — Prescription Data
 * Version 2.3.0
 *
 * Content only.
 * No selection or scoring logic lives here.
 *
 * POD thesis:
 * mind → meaning → response → behaviour → evidence → development.
 *
 * This file is the canonical source of participant-facing
 * development prescription content.
 */

"use strict";

(function (factory) {
  const data = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = data;
  }

  if (typeof window !== "undefined") {
    window.PODPrescriptionData = data;
  }
})(function () {

  const PRESCRIPTIONS = {

    visionExecution: {
      title: "Vision–Execution Gap",
      product: "Personal Optimization Drill (POD)",
      stage: "Activation",

      headline:
        "Your next development opportunity is to turn one important intention into consistent behaviour.",

      whatThisMeans:
        "You have a clear sense of what you want, but your daily behaviour is not yet consistently carrying that intention forward.",

      whyItMatters:
        "An intention becomes real when it begins to shape what you do repeatedly. Without a behavioural bridge, even a strong vision can remain an idea rather than an experience.",

      mindsetShift:
        "You do not need more planning right now. You need a small, repeatable way for your intention to become action.",

      developmentFocus:
        "Turn one important intention into consistent behaviour.",

      experiment:
        "Choose one outcome that matters to you. Decide the next physical action, when you will do it and where it will happen. For the next seven days, complete that action before adding another priority.",

      reflection:
        "What did I do today that moved my intention from my mind into my life?",

      evidence:
        "You begin to see a reliable connection between what you say matters and what you actually do.",

      pathway:
        "Personal Optimization Drill → MAP when deeper development is indicated.",

      metric:
        "Days in which the chosen action was completed.",

      metricTarget:
        "5 of 7 days.",

      reason:
        "Your profile shows direction that is currently stronger than the behavioural system that turns it into action."
    },


    identityExecution: {
      title: "Identity–Behavior Gap",
      product: "Personal Optimization Drill (POD)",
      stage: "Activation",

      headline:
        "Your next development opportunity is to create visible behavioural evidence for the identity you are building.",

      whatThisMeans:
        "Your intentions for who you are becoming are currently ahead of the evidence your daily behaviour is producing.",

      whyItMatters:
        "Identity becomes stronger when your behaviour gives you repeated evidence that the person you want to be is already showing up in your choices.",

      mindsetShift:
        "You do not have to become someone different overnight. You need to practise one behaviour that gives your mind evidence of who you are becoming.",

      developmentFocus:
        "Create visible behavioural evidence for the identity you are building.",

      experiment:
        "Choose one behaviour that the person you are becoming would consistently demonstrate. Practise it deliberately for seven days. Keep the behaviour small enough to repeat and meaningful enough to matter.",

      reflection:
        "What did I do today that gave me evidence of the person I say I am becoming?",

      evidence:
        "Your chosen identity begins to show up in repeated behaviour, not just in intention, self-description or aspiration.",

      pathway:
        "Personal Optimization Drill → MAP when deeper identity and behavioural development is indicated.",

      metric:
        "Days in which the identity-linked behaviour was demonstrated.",

      metricTarget:
        "5 of 7 days.",

      reason:
        "Your identity signal is stronger than the consistency with which it is currently expressed through behaviour."
    },


    emotionalOverride: {
      title: "Emotional Override",
      product: "Personal Optimization Drill (POD)",
      stage: "Activation",

      headline:
        "Your next development opportunity is to create space between experience and response so that intention can influence behaviour.",

      whatThisMeans:
        "Your thinking is strong, but when emotion runs high, your first reaction can move before your deliberate thinking has time to join in.",

      whyItMatters:
        "Emotion is information, not an instruction. When you can create a little space between what happens and what you do next, your response becomes more intentional.",

      mindsetShift:
        "The goal is not to become emotionless. The goal is to remain mentally available while emotion is present.",

      developmentFocus:
        "Create space between experience and response so that intention can influence behaviour.",

      experiment:
        "For the next seven days, notice moments when you feel strongly triggered, irritated, anxious, disappointed or threatened. Start small: take one breath and name what you feel. When that feels natural, ask: What meaning am I giving this situation? What response fits the person I want to be? Then choose your response deliberately.",

      reflection:
        "Did I respond from intention, or did I react from the moment?",

      evidence:
        "You begin to notice the trigger earlier, create a pause and make choices that better reflect your intention rather than the intensity of the moment.",

      pathway:
        "Personal Optimization Drill → MAP if this pattern persists after two seven-day cycles, or sooner if you want deeper support.",

      metric:
        "Moments in which you noticed the emotion, paused and deliberately chose your response.",

      metricTarget:
        "3 or more deliberate pauses in 7 days.",

      reason:
        "Your profile shows that deliberate thinking can lose influence when emotional activation becomes strong."
    },


    agencyAction: {
      title: "Agency-to-Action Gap",
      product: "Personal Optimization Drill (POD)",
      stage: "Activation",

      headline:
        "Your next development opportunity is to turn awareness of influence into one controllable action at a time.",

      whatThisMeans:
        "You recognise that your choices influence your outcomes, but that awareness does not yet consistently become action.",

      whyItMatters:
        "Awareness creates possibility; action creates evidence. The more clearly you identify what is yours to influence, the easier it becomes to move from frustration to purposeful action.",

      mindsetShift:
        "You do not need to solve everything. You need to identify what is yours to move now.",

      developmentFocus:
        "Turn awareness of influence into one controllable action at a time.",

      experiment:
        "Choose one situation that matters to you. Separate what you can control, what you can influence and what you cannot control. Then act on the smallest meaningful thing that is genuinely yours to move. Repeat this each day for seven days.",

      reflection:
        "What is mine to do now?",

      evidence:
        "You spend less energy circling what cannot be changed and more energy creating movement where your choices can make a difference.",

      pathway:
        "Personal Optimization Drill → MAP if this pattern persists after two seven-day cycles, or sooner if you want deeper support.",

      metric:
        "Days in which you completed one meaningful controllable action.",

      metricTarget:
        "5 of 7 days.",

      reason:
        "Your profile shows that recognising personal influence is currently stronger than converting that awareness into action."
    },


    relationalAdaptation: {
      title: "Relational Over-Adaptation",
      product: "Personal Optimization Drill (POD)",
      stage: "Activation",

      headline:
        "Your next development opportunity is to express your needs, values and boundaries without unnecessary withdrawal or conflict.",

      whatThisMeans:
        "You are highly attentive to other people and to what relationships need, and sometimes your own needs, values or direction become quieter as a result.",

      whyItMatters:
        "Healthy connection does not require you to disappear inside other people's expectations. Alignment includes being able to stay connected without abandoning what matters to you.",

      mindsetShift:
        "Authenticity is not the opposite of connection. You can protect a relationship while also expressing what is true and important to you.",

      developmentFocus:
        "Express your needs, values and boundaries without unnecessary withdrawal or conflict.",

      experiment:
        "Choose three low-risk conversations over the next seven days, with people and in situations where honesty is safe. Before each one, clarify what you need, what you value, what boundary matters and what you are asking for. Then say it calmly and directly.",

      reflection:
        "What did I make room for in the relationship without making myself smaller?",

      evidence:
        "You become more able to express what matters to you while remaining present, respectful and connected.",

      pathway:
        "Personal Optimization Drill → MAP if this pattern persists after two seven-day cycles, or sooner if you want deeper support.",

      metric:
        "Conversations in which you clearly expressed a need, value, boundary or request.",

      metricTarget:
        "2 or more of 3 conversations.",

      reason:
        "Your profile shows that keeping relationships harmonious can take precedence over expressing your own direction and priorities."
    },


    fragmentedDirection: {
      title: "Fragmented Direction",
      product: "Personal Optimization Drill (POD)",
      stage: "Activation",

      headline:
        "Your next development opportunity is to create one coherent direction and reduce competing priorities.",

      whatThisMeans:
        "Different parts of your profile are developing at different speeds, and your larger direction is not yet clear enough to organise your attention and choices.",

      whyItMatters:
        "When too many priorities compete for attention, even capable people can feel busy without creating meaningful movement. Coherence gives your effort somewhere to go.",

      mindsetShift:
        "You do not need to pursue everything that matters. You need enough clarity to know what matters most right now.",

      developmentFocus:
        "Create one coherent direction and reduce competing priorities.",

      experiment:
        "Choose the one priority that matters most this week. Each morning, decide one next action for it and protect time to do it. Say no to anything that competes with it unless it is genuinely necessary. At the end of the week, use what you learned to set a 30-day direction.",

      reflection:
        "Is what I am doing today helping the direction I have chosen, or competing with it?",

      evidence:
        "Your decisions become clearer, priority switching reduces and your daily actions begin to reinforce one direction.",

      pathway:
        "Personal Optimization Drill → MAP if this pattern persists after two seven-day cycles, or sooner if you want deeper support.",

      metric:
        "Days in which the chosen priority received its protected next action.",

      metricTarget:
        "5 of 7 days.",

      reason:
        "Your profile shows competing priorities that may be diluting the force of your intention."
    },


    expansionReadiness: {
      title: "Expansion Readiness",
      product: "MAP",
      stage: "Development",

      headline:
        "Your next development opportunity is to turn existing alignment into deliberate capability expansion.",

      whatThisMeans:
        "Your profile shows a strong developmental foundation across identity, intention and growth orientation, with no dominant gap demanding repair.",

      whyItMatters:
        "When alignment is relatively strong, development can move beyond fixing gaps and toward expanding what you are capable of creating, leading and becoming.",

      mindsetShift:
        "You do not need to wait until everything is perfect before you grow. Growth can now come through deliberate challenge, practice and feedback.",

      developmentFocus:
        "Turn existing alignment into deliberate capability expansion.",

      experiment:
        "Choose one meaningful capability that would expand what you can contribute or create. Stretch yourself five times in the next seven days. After each attempt, ask what worked, what did not and what you will change next time.",

      reflection:
        "What could become possible if I deliberately developed the capability I am currently underusing?",

      evidence:
        "You begin producing evidence of a new capability rather than simply thinking about its potential.",

      pathway:
        "MAP → Advanced Human Potential Development when broader capability expansion is appropriate.",

      metric:
        "Deliberate stretch practices completed.",

      metricTarget:
        "4 of 5 stretches, with a short reflection after each attempt.",

      reason:
        "Your profile shows a strong developmental foundation. The opportunity is expansion through challenge, practice and feedback, not deficit correction."
    },


    integrated: {
      title: "Integrated Alignment",
      product: "Personal Optimization Drill (POD)",
      stage: "Refinement",

      headline:
        "Your next development opportunity is to strengthen the next leverage point through deliberate practice.",

      whatThisMeans:
        "Your profile shows no dominant gap pattern. The opportunity is to strengthen one area that can create greater leverage, without treating your current alignment as something to repair.",

      whyItMatters:
        "Development is not only about fixing weaknesses. Sometimes the next step is learning how to use existing strengths more deliberately and consistently.",

      mindsetShift:
        "Do not change everything at once. Build on what is already working and strengthen one meaningful leverage point.",

      developmentFocus:
        "Strengthen the next leverage point through deliberate practice.",

      experiment:
        "Choose the dimension that would create the greatest positive difference in your current life or work. Select one behaviour connected to that area and practise it deliberately five times over the next seven days.",

      reflection:
        "What small change would make my existing strengths more useful in the life I am building?",

      evidence:
        "The selected leverage area becomes more consistent and begins to produce observable movement in your everyday experience.",

      pathway:
        "Personal Optimization Drill → MAP when deeper development is indicated.",

      metric:
        "Targeted practices completed.",

      metricTarget:
        "4 of 5 practices, followed by reassessment of the selected leverage area.",

      reason:
        "No dominant gap pattern is detected. The opportunity is refinement and leverage, not repair."
    }

  };


  const SECONDARY_MODIFIERS = {

    visionExecution:
      "Keep the primary focus practical: connect the insight to a specific time, place and action.",

    identityExecution:
      "Make the development experiment visibly connected to the person the participant is becoming.",

    emotionalOverride:
      "Before the primary practice, create a deliberate pause so emotion can be noticed without automatically directing the response.",

    agencyAction:
      "Keep bringing the focus back to the next action that is genuinely within the participant's control or influence.",

    relationalAdaptation:
      "Include a small authenticity or boundary component so connection does not require self-abandonment.",

    fragmentedDirection:
      "Reduce competing priorities before adding new commitments; coherence comes before volume.",

    expansionReadiness:
      "Keep the development frame expansive. Do not turn an opportunity for growth into a story about deficiency.",

    integrated:
      "Use the most strategically relevant dimension as a refinement target rather than treating the profile as a problem to fix."
  };


  return {
    PRESCRIPTIONS,
    SECONDARY_MODIFIERS
  };

});
