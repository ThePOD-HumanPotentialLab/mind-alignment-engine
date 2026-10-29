/* The POD: entry and preparation (front end) */
(function () {
  var SECTIONS = ["loading", "closed", "join", "unpaid", "assignment", "mindprint", "vowView", "ready"];
  var TOKEN_KEY = "podToken";
  var REF_KEY = "podReference";
  var config = null;

  function $(id) { return document.getElementById(id); }

  function store(key, value) {
    try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (e) {}
  }
  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function show(id) {
    SECTIONS.forEach(function (s) { $(s).classList.toggle("hidden", s !== id); });
    window.scrollTo(0, 0);
  }

  function say(id, text, isError) {
    var el = $(id);
    el.textContent = text || "";
    el.classList.toggle("error", !!isError);
  }

  function api(path, options) {
    return fetch(path, options).then(function (r) {
      return r.json().catch(function () { return { success: false, error: "Something went wrong. Please try again." }; });
    }).catch(function () {
      return { success: false, error: "We could not reach the POD. Check your connection and try again." };
    });
  }

  function post(path, body) {
    return api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }

  function busy(btn, on, text) {
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = text || "One moment…"; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }

  function route(state) {
    if (!state.paid) return show("unpaid");
    if (!state.assignmentDeclared) return show("assignment");
    if (!state.mindprint) return show("mindprint");
    if (!state.vowTaken) return show("vowView");
    var first = (state.name || "").split(" ")[0];
    $("readyTitle").textContent = first ? "You are ready, " + first + "." : "You are ready.";
    $("readyHour").textContent = state.mindprint.chosenHour === "morning" ? "First thing in the morning, before the day begins." : "Last thing at night, as the final act of your day.";
    $("readyGoals").innerHTML = "";
    state.mindprint.top5.forEach(function (g) {
      var li = document.createElement("li"); li.textContent = g; $("readyGoals").appendChild(li);
    });
    show("ready");
  }

  function startJoin() {
    if (!config || !config.open) return show("closed");
    var plan = config.plans[0];
    $("price").innerHTML = "₦" + plan.amount.toLocaleString("en-NG") + " <small>" + plan.name.replace(/^The POD \(|\)$/g, "") + " price</small>";
    show("join");
  }

  function pay(name, email, btn, msgId) {
    busy(btn, true, "Opening payment…");
    post("/api/pod/join", { name: name, email: email, plan: config.plans[0].id }).then(function (res) {
      if (!res.success) { busy(btn, false); return say(msgId, res.error, true); }
      store(TOKEN_KEY, res.token);
      store(REF_KEY, res.reference);
      window.location.href = res.authorizationUrl;
    });
  }

  function verify(reference) {
    show("loading");
    return api("/api/pod/verify?reference=" + encodeURIComponent(reference)).then(function (res) {
      if (!res.success) { show("unpaid"); return say("unpaidMsg", res.error, true); }
      store(TOKEN_KEY, res.token);
      if (res.state.paid) store(REF_KEY, null);
      history.replaceState(null, "", "/pod");
      route(res.state);
    });
  }

  /* ---- Join ---- */
  $("joinBtn").addEventListener("click", function () {
    var name = $("name").value.trim(), email = $("email").value.trim();
    if (!name || !email) return say("joinMsg", "Please enter your name and email address.", true);
    say("joinMsg", "");
    pay(name, email, $("joinBtn"), "joinMsg");
  });

  $("showRecover").addEventListener("click", function () {
    $("recover").classList.toggle("hidden");
  });

  $("recoverBtn").addEventListener("click", function () {
    var btn = $("recoverBtn");
    busy(btn, true);
    post("/api/pod/recover", { email: $("recEmail").value, reference: $("recRef").value }).then(function (res) {
      busy(btn, false);
      if (!res.success) return say("recMsg", res.error, true);
      store(TOKEN_KEY, res.token);
      route(res.state);
    });
  });

  /* ---- Unpaid ---- */
  $("recheckBtn").addEventListener("click", function () {
    var ref = read(REF_KEY);
    if (ref) return verify(ref);
    say("unpaidMsg", "We could not find your payment on this device. Try the payment again, or restore your access.", true);
  });

  $("retryBtn").addEventListener("click", function () {
    store(TOKEN_KEY, null);
    store(REF_KEY, null);
    startJoin();
  });

  /* ---- Assignment ---- */
  $("assignBtn").addEventListener("click", function () {
    var all = Array.prototype.every.call(document.querySelectorAll(".ac"), function (c) { return c.checked; });
    var declaration = $("declaration").value.trim();
    if (!all) return say("assignMsg", "Please confirm each part of the assignment.", true);
    if (declaration.length < 20) return say("assignMsg", "Please declare your assignment in a full sentence, in your own words.", true);
    var btn = $("assignBtn");
    busy(btn, true);
    post("/api/pod/assignment", { token: read(TOKEN_KEY), confirmed: true, declaration: declaration }).then(function (res) {
      busy(btn, false);
      if (!res.success) return say("assignMsg", res.error, true);
      say("assignMsg", "");
      route(res.state);
    });
  });

  /* ---- Mindprint ---- */
  for (var i = 1; i <= 5; i++) {
    var row = document.createElement("div");
    row.className = "goal";
    row.innerHTML = "<span>" + i + ".</span><input type=\"text\" class=\"g\" maxlength=\"200\" placeholder=\"" +
      (i === 1 ? "e.g. I am a respected leader who builds people." : "Goal " + i) + "\">";
    $("goals").appendChild(row);
  }

  function choice(name) {
    var el = document.querySelector("input[name=\"" + name + "\"]:checked");
    return el ? el.value : "";
  }

  $("mindprintBtn").addEventListener("click", function () {
    var top5 = Array.prototype.map.call(document.querySelectorAll(".g"), function (g) { return g.value.trim(); });
    if (top5.some(function (g) { return g.length < 3; })) return say("mindprintMsg", "Please enter all five of your top goals.", true);
    var body = {
      token: read(TOKEN_KEY), top5: top5,
      chosenHour: choice("chosenHour"), faithMode: choice("faithMode"), lifeSeason: choice("lifeSeason"),
      primaryTarget: choice("primaryTarget"), tone: choice("tone")
    };
    if (!body.chosenHour || !body.faithMode || !body.lifeSeason || !body.primaryTarget || !body.tone) {
      return say("mindprintMsg", "Please answer every question.", true);
    }
    var btn = $("mindprintBtn");
    busy(btn, true);
    post("/api/pod/mindprint", body).then(function (res) {
      busy(btn, false);
      if (!res.success) return say("mindprintMsg", res.error, true);
      say("mindprintMsg", "");
      route(res.state);
    });
  });

  /* ---- Vow ---- */
  $("vowBtn").addEventListener("click", function () {
    var btn = $("vowBtn");
    busy(btn, true);
    post("/api/pod/vow", { token: read(TOKEN_KEY), vow: $("vowInput").value }).then(function (res) {
      busy(btn, false);
      if (!res.success) return say("vowMsg", res.error, true);
      say("vowMsg", "");
      route(res.state);
    });
  });

  /* ---- Start ---- */
  api("/api/pod/config").then(function (res) {
    config = res.success ? res : { open: false, plans: [] };
    if (config.vow) $("vowText").textContent = config.vow;

    var params = new URLSearchParams(window.location.search);
    var reference = params.get("reference") || params.get("trxref");
    if (reference) return verify(reference);

    var token = read(TOKEN_KEY);
    if (!token) return startJoin();

    api("/api/pod/state?token=" + encodeURIComponent(token)).then(function (s) {
      if (!s.success) { store(TOKEN_KEY, null); return startJoin(); }
      if (!s.state.paid) {
        var ref = read(REF_KEY);
        if (ref) return verify(ref);
      }
      route(s.state);
    });
  });
})();
