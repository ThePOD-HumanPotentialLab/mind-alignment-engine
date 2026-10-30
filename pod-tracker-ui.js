/* The POD: the 21-day tracker screen (front end) */
(function () {
  var css = [
    ".prompt{font-family:var(--serif);font-style:italic;font-size:19px;line-height:1.55;margin:0;color:var(--ink)}",
    ".stats{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 22px;font-size:13px;color:var(--muted);margin:22px 0 4px}",
    ".stats strong{color:var(--ink);font-size:18px;font-weight:600}",
    ".boundary{font-size:14px;color:var(--muted);font-style:italic;margin:-4px 0 14px}",
    "#ready details.yours{margin-top:18px;border-top:1px solid var(--line);padding-top:10px}",
    ".tq{font-family:var(--serif-display);font-size:26px;line-height:1.25;color:var(--ink);margin:4px 0 16px}",
    "#ready .card + .card{margin-top:16px}"
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
      h += "<div class=\"panel\"><div class=\"label\">Before your hour · Day " + t.nextDay + "</div><p class=\"prompt\">" + esc(t.prompt) + "</p></div>";
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

    h += "<details class=\"more yours\"><summary>Your hour and your top 5</summary>";
    h += "<p style=\"margin:10px 0 6px\">" + (t.chosenHour === "morning" ? "First thing in the morning, before the day begins." : "Last thing at night, as the final act of your day.") + "</p><ol class=\"plain\">";
    t.top5.forEach(function (g) { h += "<li>" + esc(g) + "</li>"; });
    h += "</ol></details>";

    box.innerHTML = h;
    wire(t);
  }

  function say(text) {
    var m = el("ciMsg");
    if (m) { m.textContent = text || ""; m.classList.toggle("error", !!text); }
  }

  function send(body, btn) {
    btn.disabled = true;
    body.token = token;
    api("/api/pod/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(function (res) {
      btn.disabled = false;
      if (!res.success) return say(res.error);
      lastReply = res.reply;
      render(res.tracker);
      window.scrollTo(0, 0);
    });
  }

  function wire(t) {
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
      token = t;
      lastReply = null;
      api("/api/pod/tracker?token=" + encodeURIComponent(token)).then(function (res) {
        if (res.success) render(res.tracker);
      });
    }
  };
})();
