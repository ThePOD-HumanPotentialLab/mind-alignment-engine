/* The POD: the 21-day tracker screen (front end) */
(function () {
  var css = [
    ".prompt{font-family:var(--serif);font-style:italic;font-size:19px;line-height:1.55;margin:0;color:var(--ink)}",
    ".stats{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 22px;font-size:13px;color:var(--muted);margin:22px 0 4px}",
    ".stats strong{color:var(--ink);font-size:18px;font-weight:600}",
    ".boundary{font-size:14px;color:var(--muted);font-style:italic;margin:-4px 0 14px}",
    "#ready details.yours{margin-top:18px;border-top:1px solid var(--line);padding-top:10px}",
    ".tq{font-family:var(--serif-display);font-size:26px;line-height:1.25;color:var(--ink);margin:4px 0 16px}",
    "#ready .card + .card{margin-top:16px}",
    ".ask .turn{margin:0 0 14px}",
    ".ask .q{font-size:14px;color:var(--muted);margin:0 0 6px}",
    ".ask .a{font-family:var(--serif);font-size:18px;line-height:1.55;color:var(--ink);white-space:pre-line}",
    ".thinking{font-family:var(--serif);font-style:italic;color:var(--muted)}",
    "#safetyBanner{position:sticky;top:8px;z-index:50;margin:8px auto 18px;width:min(720px,calc(100% - 36px));background:#7d1f12;color:#fff;border:2px solid #ffb4a3;border-radius:20px;padding:18px 20px;box-shadow:0 10px 30px rgba(125,31,18,.35);animation:sfPulse 1.6s ease-in-out infinite}",
    "@keyframes sfPulse{0%,100%{background:#7d1f12;border-color:#ffb4a3}50%{background:#a8301c;border-color:#fff}}",
    "#safetyBanner h3{color:#fff;font-family:var(--sans);font-size:17px;font-weight:600;margin:0 0 6px}",
    "#safetyBanner p{font-size:14px;margin:0 0 10px;color:#fff}",
    "#safetyBanner a.sf{display:flex;justify-content:space-between;gap:12px;align-items:center;background:rgba(255,255,255,.14);color:#fff;text-decoration:none;border-radius:12px;padding:11px 14px;margin:6px 0;font-size:14px;min-height:44px}",
    "#safetyBanner a.sf strong{font-size:16px;white-space:nowrap;overflow-wrap:anywhere}",
    "#safetyBanner button{background:none;border:0;color:#fff;text-decoration:underline;font:13px var(--sans);margin-top:6px;cursor:pointer;min-height:44px}"
  ].join("\n");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var token = null;
  var lastReply = null;

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }
  function nice(date) {
    return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  }
  function api(path, options) {
    return fetch(path, options).then(function (r) {
      return r.json().catch(function () { return { success: false, error: "Something went wrong. Please try again." }; });
    }).catch(function () {
      return { success: false, error: "We could not reach the POD. Check your connection and try again." };
    });
  }

  function render(t) {
    var box = el("ready");
    var title;
    if (t.completed) title = "Twenty-one unbroken days.";
    else if (t.ended) title = "Your POD window has ended.";
    else if (t.kept === 0 && !t.checkinOpen) title = "Day 1 begins " + nice(t.day1Date) + ".";
    else title = "Day " + t.nextDay + " of 21";

    var h = "<div class=\"eyebrow center\" style=\"margin-top:4px\">The Personal Optimization Drill</div>";
    h += "<h2 class=\"center\">" + esc(title) + "</h2>";
    h += window.GardenArt ? window.GardenArt.vine(t.kept, t.completed || t.ended ? 0 : t.nextDay) : "";

    if (lastReply) h += "<div class=\"reply\"><div class=\"label\">The Optimizer</div>" + esc(lastReply) + "</div>";
    else if (t.notice) h += "<div class=\"reply\"><div class=\"label\">The Optimizer</div>" + esc(t.notice) + "</div>";
    if (t.warning) h += "<div class=\"reply\"><div class=\"label\">Your window</div>" + esc(t.warning) + "</div>";

    h += "<div class=\"card\">";
    if (t.completed) {
      if (!lastReply) h += "<div class=\"reply\"><div class=\"label\">The Optimizer</div>" + esc(t.completion) + "</div>";
      h += "<a class=\"btn\" href=\"/pod-certificate\">Open my certificate and declaration</a>";
    } else if (!t.ended) {
      h += "<div class=\"panel\"><div class=\"label\">Before your hour · Day " + t.nextDay + "</div><p class=\"prompt\" id=\"dayPrompt\">" + esc(t.prompt) + "</p></div>";
      if (t.checkinOpen) {
        h += "<div id=\"checkin\">";
        h += "<div class=\"label\">Your check-in · Day " + t.nextDay + "</div>";
        h += "<p class=\"tq\">Did you keep the hour in unbroken silence?</p>";
        h += "<div class=\"row\" style=\"margin-top:0\"><button class=\"btn\" id=\"ciYes\">Yes, I kept it</button><button class=\"btn ghost\" id=\"ciNo\">No, it was broken</button></div>";
        h += "</div>";
        h += "<div id=\"mirror\" class=\"hidden\">";
        h += "<div class=\"label\">The Mirror Moment · Day " + t.nextDay + "</div>";
        h += "<p class=\"boundary\">Share what you learned, not what you wrote to God.</p>";
        h += "<label class=\"label\" for=\"mmSaw\" style=\"display:block;margin-top:10px\">What did I see in myself today?</label><textarea id=\"mmSaw\" style=\"min-height:80px\"></textarea>";
        h += "<label class=\"label\" for=\"mmLearned\" style=\"display:block\">What did I learn?</label><textarea id=\"mmLearned\" style=\"min-height:80px\"></textarea>";
        h += "<label class=\"label\" for=\"mmCarry\" style=\"display:block\">What will I carry into today?</label><textarea id=\"mmCarry\" style=\"min-height:80px\"></textarea>";
        h += "<div class=\"row\" style=\"margin-top:6px\"><button class=\"btn\" id=\"mmSubmit\">Complete Day " + t.nextDay + "</button><button class=\"link\" id=\"mmBack\">Go back</button></div>";
        h += "</div>";
        h += "<div id=\"brokenConfirm\" class=\"hidden panel\">";
        h += "<p style=\"margin-bottom:12px\">Thank you for your honesty. When you confirm, the count returns to Day 1, and Day 1 begins with your next hour.</p>";
        h += "<div class=\"row\" style=\"margin-top:0\"><button class=\"btn\" id=\"brYes\">Confirm: the silence was broken</button><button class=\"link\" id=\"brBack\">Go back</button></div>";
        h += "</div>";
        h += "<p class=\"msg\" id=\"ciMsg\"></p>";
      } else {
        h += "<p>Your Day " + t.nextDay + " check-in opens on <strong>" + esc(nice(t.nextDate)) + "</strong> at " + esc(t.opens) +
          ". Check in by " + esc(t.closes) + ", after you have kept the hour.</p>";
      }
    }

    h += "</div>";
    h += "<div class=\"stats\"><span><strong>" + t.totalKept + "</strong> hours kept</span>";
    if (t.restarts) h += "<span><strong>" + t.restarts + "</strong> " + (t.restarts === 1 ? "return" : "returns") + " to Day 1</span>";
    if (!t.completed) h += "<span><strong>" + t.daysLeft + "</strong> days left in your window</span>";
    h += "</div>";

    if (!t.completed && !t.ended) h += reminder(t);

    var morning = t.chosenHour === "morning";
    var parts = [
      ["Self-Judgment and Daily Goals", "10 min", morning ?
        "Judge yesterday fairly: commend yourself for what you did well, then correct yourself where you fell short, in writing. Then write three to five things you will do today to move closer to the person you have decided to become." :
        "Judge today fairly: commend yourself for what you did well, then correct yourself where you fell short, in writing. Then write three to five things you will do tomorrow to move closer to the person you have decided to become."],
      ["How I'll Show Up: 1 to 5 Years", "10 min", "Rewrite your near goals in the possessive."],
      ["How I'll Show Up: 5 to 10 Years", "10 min", "Rewrite your far goals in the possessive."],
      ["Quest for Knowledge", "15 min", "Read an instructive book for ten minutes. Close it, then recall in writing what you read."],
      ["Alone with God", "15 min", "Begin with gratitude. Then write to God every question, praise, fear, doubt, worry and need."]
    ];
    h += "<details class=\"more yours\"><summary>Your hour, part by part</summary>";
    h += "<p class=\"small\" style=\"margin:4px 0 8px\">" + (morning ? "First thing in the morning, before the day begins." : "Last thing at night, as the final act of your day.") + " One hour, pen and paper only, in unbroken silence.</p><ol class=\"plain\">";
    parts.forEach(function (pt) { h += "<li style=\"margin-bottom:10px\"><strong>" + esc(pt[0]) + "</strong> <span class=\"small\">· " + pt[1] + "</span><br>" + esc(pt[2]) + "</li>"; });
    h += "</ol></details>";
    h += "<details class=\"more yours\"><summary>Your top 5</summary><ol class=\"plain\">";
    t.top5.forEach(function (g) { h += "<li>" + esc(g) + "</li>"; });
    h += "</ol></details>";
    h += "<div id=\"askBox\"></div>";

    box.innerHTML = h;
    wire(t);
  }

  /* Daily reminder: a calendar event for each day that remains */
  var CAL_TIME = "pod_reminder_time", CAL_ADDED = "pod_reminder_added";
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function times(hour) {
    var out = [], from = hour === "night" ? 36 : 8, to = hour === "night" ? 47 : 44; // half-hours
    for (var i = from; i <= to; i++) {
      var hh = Math.floor(i / 2), mm = i % 2 ? "30" : "00";
      var label = ((hh + 11) % 12 + 1) + ":" + mm + (hh < 12 ? " am" : " pm");
      out.push([(hh < 10 ? "0" : "") + hh + ":" + mm, label]);
    }
    return out;
  }
  function calLinks(t, time) {
    var count = 21 - t.kept;
    var ics = "/api/pod/calendar.ics?start=" + t.nextDate + "&count=" + count + "&hour=" + t.chosenHour + "&time=" + time;
    var p = time.split(":"), startMs = Date.parse(t.nextDate + "T00:00:00Z") + (Number(p[0]) * 60 + Number(p[1])) * 60000 - 3600000;
    var stamp = function (ms) { return new Date(ms).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z"; };
    var details = "Your hour of unbroken silence: pen and paper only.\nAfterwards, check in here: " + location.origin + "/pod\nCheck in by " + t.closes + ".";
    var google = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent("The POD: keep your " + t.chosenHour + " hour") +
      "&dates=" + stamp(startMs) + "/" + stamp(startMs + 3600000) +
      "&ctz=Africa/Lagos&recur=" + encodeURIComponent("RRULE:FREQ=DAILY;COUNT=" + count) +
      "&details=" + encodeURIComponent(details);
    return { ics: ics, google: google };
  }
  function reminder(t) {
    var opts = times(t.chosenHour);
    var saved = store(CAL_TIME);
    var time = opts.some(function (o) { return o[0] === saved; }) ? saved : (t.chosenHour === "night" ? "21:00" : "06:00");
    var links = calLinks(t, time);
    var h = "<details class=\"more yours\" id=\"remind\"" + (store(CAL_ADDED) ? "" : " open") + "><summary>Remind me every day</summary>";
    h += "<p class=\"small\" style=\"margin:4px 0 10px\">Add your hour to your phone's calendar. You will get a reminder when your hour begins, and a last call two hours before your check-in closes. It covers the " +
      (21 - t.kept) + " days that remain, from " + esc(nice(t.nextDate)) + ".</p>";
    h += "<label class=\"label\" for=\"remTime\" style=\"display:block;margin-top:4px\">I will keep my hour at</label><select id=\"remTime\">";
    opts.forEach(function (o) { h += "<option value=\"" + o[0] + "\"" + (o[0] === time ? " selected" : "") + ">" + o[1] + "</option>"; });
    h += "</select>";
    h += "<div class=\"row\" style=\"margin-top:4px\"><a class=\"btn\" id=\"remIcs\" href=\"" + esc(links.ics) + "\">iPhone or Apple Calendar</a>" +
      "<a class=\"btn ghost\" id=\"remGoogle\" target=\"_blank\" rel=\"noopener\" href=\"" + esc(links.google) + "\">Google Calendar (Android)</a></div>";
    h += "<p class=\"small\" style=\"margin-top:10px\">If you return to Day 1, come back here and add the new days. Then delete the old reminder in your calendar.</p>";
    h += "</details>";
    return h;
  }
  function wireReminder(t) {
    if (!el("remind")) return;
    var update = function () {
      store(CAL_TIME, el("remTime").value);
      var links = calLinks(t, el("remTime").value);
      el("remIcs").href = links.ics; el("remGoogle").href = links.google;
    };
    el("remTime").onchange = update;
    el("remIcs").onclick = el("remGoogle").onclick = function () { store(CAL_TIME, el("remTime").value); store(CAL_ADDED, "1"); };
  }

  /* The Optimizer: today's prompt, questions and affirmations */
  function post(path, body) {
    body.token = token;
    return api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  function loadPrompt() {
    var box = el("dayPrompt");
    if (!box) return;
    post("/api/pod/optimizer/prompt", {}).then(function (res) {
      if (res.success && res.prompt && el("dayPrompt")) el("dayPrompt").textContent = res.prompt;
    });
  }
  function askHtml(state) {
    var h = "<div class=\"card ask\"><div class=\"label\" style=\"margin-top:0\">Ask the Optimizer</div>";
    h += "<p class=\"small\" style=\"margin-bottom:12px\">Questions about the practice: how to do a part of the hour, what to read, how to protect your silence. Never share what you wrote during the hour or to God.</p>";
    state.turns.forEach(function (tn) {
      h += "<div class=\"turn\"><p class=\"q\">You: " + esc(tn.q) + "</p><div class=\"a\">" + esc(tn.a) + "</div></div>";
    });
    if (state.remaining > 0) {
      h += "<textarea id=\"askQ\" maxlength=\"600\" style=\"min-height:70px\" placeholder=\"Ask your question\"></textarea>";
      h += "<div class=\"row\" style=\"margin-top:0\"><button class=\"btn\" id=\"askSend\">Ask</button><button class=\"btn ghost\" id=\"affirmBtn\">Draft my affirmations</button></div>";
      h += "<p class=\"small\" style=\"margin-top:8px\">" + state.remaining + " " + (state.remaining === 1 ? "question" : "questions") + " left today.</p>";
    } else {
      h += "<p class=\"small\">That is enough questions for today. You can ask again tomorrow.</p><div class=\"row\" style=\"margin-top:0\"><button class=\"btn ghost\" id=\"affirmBtn\">Draft my affirmations</button></div>";
    }
    h += "<div id=\"affirmOut\"></div><p class=\"msg\" id=\"askMsg\"></p></div>";
    return h;
  }
  function askSay(text, thinking) {
    var m = el("askMsg");
    if (!m) return;
    m.classList.toggle("error", !!text && !thinking);
    m.innerHTML = thinking ? "<span class=\"thinking\">" + esc(text) + "</span>" : esc(text || "");
  }
  function drawAsk(state) {
    var box = el("askBox");
    if (!box) return;
    box.innerHTML = askHtml(state);
    if (el("askSend")) el("askSend").onclick = function () {
      var q = el("askQ").value.trim();
      if (q.length < 3) return askSay("Please write your question.");
      el("askSend").disabled = true;
      askSay("The Optimizer is thinking…", true);
      post("/api/pod/optimizer/ask", { question: q }).then(function (res) {
        if (!res.success) { el("askSend").disabled = false; return askSay(res.error); }
        state.turns.push({ q: q, a: res.answer });
        state.remaining = res.remaining;
        drawAsk(state);
        if (res.safety) showSafety(res.safety);
      });
    };
    el("affirmBtn").onclick = function () {
      el("affirmBtn").disabled = true;
      askSay("The Optimizer is drafting your affirmations…", true);
      post("/api/pod/optimizer/affirmations", {}).then(function (res) {
        el("affirmBtn").disabled = false;
        if (!res.success) return askSay(res.error);
        askSay("");
        el("affirmOut").innerHTML = "<div class=\"reply\" style=\"margin-top:16px\"><div class=\"label\">Your affirmations for today</div><div style=\"white-space:pre-line\">" + esc(res.text) + "</div></div>";
      });
    };
  }
  function loadAsk() {
    if (!el("askBox")) return;
    post("/api/pod/optimizer/ask", {}).then(function (res) {
      if (res.success && res.on) drawAsk({ turns: res.turns || [], remaining: res.remaining });
    });
  }

  /* Safety banner: shown at once when a message speaks of harm (brief, section 11) */
  var SAFETY_KEY = "pod_safety_contacts";
  function showSafety(contacts) {
    if (!contacts || !contacts.length) return;
    try { sessionStorage.setItem(SAFETY_KEY, JSON.stringify(contacts)); } catch (e) {}
    var b = el("safetyBanner");
    if (!b) {
      b = document.createElement("div");
      b.id = "safetyBanner";
      b.setAttribute("role", "alert");
      b.tabIndex = -1;
      el("ready").parentNode.insertBefore(b, el("ready"));
    }
    var h = "<h3>Please get help now</h3><p>If you are in danger, or thinking of harming yourself or someone else, call one of these numbers now, or reach out to The POD.</p>";
    contacts.forEach(function (c) {
      h += "<a class=\"sf\" href=\"" + esc(c.href) + "\"><span>" + esc(c.name) + "</span><strong>" + esc(c.number) + "</strong></a>";
    });
    h += "<button type=\"button\" id=\"sfClose\">I am safe for now. Hide this.</button>";
    b.innerHTML = h;
    el("sfClose").onclick = function () {
      try { sessionStorage.removeItem(SAFETY_KEY); } catch (e) {}
      b.parentNode.removeChild(b);
    };
    window.scrollTo(0, 0);
    b.focus();
  }

  function say(text) {
    var m = el("ciMsg");
    if (m) { m.textContent = text || ""; m.classList.toggle("error", !!text); }
  }

  function send(body, btn) {
    btn.disabled = true;
    if (body.kept) { var m = el("ciMsg"); if (m) { m.classList.remove("error"); m.innerHTML = "<span class=\"thinking\">The Optimizer is reading your Mirror Moment…</span>"; } }
    body.token = token;
    api("/api/pod/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(function (res) {
      btn.disabled = false;
      if (!res.success) return say(res.error);
      lastReply = res.reply;
      render(res.tracker);
      window.scrollTo(0, 0);
      if (res.safety) showSafety(res.safety);
    });
  }

  function wire(t) {
    wireReminder(t);
    loadPrompt();
    loadAsk();
    if (!el("checkin")) return;
    el("ciYes").onclick = function () { el("checkin").classList.add("hidden"); el("mirror").classList.remove("hidden"); el("mmSaw").focus(); };
    el("ciNo").onclick = function () { el("checkin").classList.add("hidden"); el("brokenConfirm").classList.remove("hidden"); };
    el("mmBack").onclick = el("brBack").onclick = function () {
      el("mirror").classList.add("hidden"); el("brokenConfirm").classList.add("hidden"); el("checkin").classList.remove("hidden"); say("");
    };
    el("brYes").onclick = function () { send({ kept: false }, el("brYes")); };
    el("mmSubmit").onclick = function () {
      var saw = el("mmSaw").value.trim(), learned = el("mmLearned").value.trim(), carry = el("mmCarry").value.trim();
      if (saw.length < 3 || learned.length < 3 || carry.length < 3) return say("Please answer all three questions, even in a single sentence each.");
      send({ kept: true, saw: saw, learned: learned, carry: carry }, el("mmSubmit"));
    };
  }

  window.PODTracker = {
    start: function (t) {
      setTimeout(function () { try { var sc = JSON.parse(sessionStorage.getItem(SAFETY_KEY) || "null"); if (sc && el("ready")) showSafety(sc); } catch (e) {} }, 0);
      token = t;
      lastReply = null;
      api("/api/pod/tracker?token=" + encodeURIComponent(token)).then(function (res) {
        if (res.success) render(res.tracker);
      });
    }
  };
})();
