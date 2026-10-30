/* The POD: botanical illustrations, drawn in code so they follow day and night colours. */
(function () {
  var S = function (s) { return "style=\"" + s + "\""; };
  var STEM = S("stroke:var(--sage-text);fill:none;stroke-linecap:round");
  var INK = "var(--sage-text)";

  function ornament() {
    return "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 20 C 12 14, 12 9, 12 4\" " + S("stroke:var(--gold);fill:none;stroke-width:1.3;stroke-linecap:round") + "/>" +
      "<path d=\"M12 13 C 8 12, 6 9, 6 6 C 9 6, 12 9, 12 13Z\" " + S("fill:var(--gold-soft);stroke:var(--gold);stroke-width:1.1") + "/>" +
      "<path d=\"M12 10 C 16 9, 18 6, 18 3 C 15 3, 12 6, 12 10Z\" " + S("fill:var(--gold-soft);stroke:var(--gold);stroke-width:1.1") + "/></svg>";
  }

  // The seed breaking through the soil (assessment)
  function seed() {
    return "<svg class=\"illus\" viewBox=\"0 0 320 180\" style=\"max-width:300px\" aria-hidden=\"true\">" +
      "<circle cx=\"160\" cy=\"96\" r=\"74\" " + S("fill:var(--gold-soft);opacity:.45") + "/>" +
      "<circle cx=\"160\" cy=\"96\" r=\"50\" " + S("fill:var(--gold-soft);opacity:.45") + "/>" +
      "<path d=\"M30 122 C 90 110, 230 110, 290 122\" " + STEM + " stroke-width=\"1.6\"/>" +
      "<g " + S("fill:var(--gold);opacity:.4") + "><circle cx=\"78\" cy=\"138\" r=\"1.6\"/><circle cx=\"104\" cy=\"154\" r=\"1.3\"/><circle cx=\"126\" cy=\"144\" r=\"1.2\"/><circle cx=\"212\" cy=\"150\" r=\"1.5\"/><circle cx=\"236\" cy=\"138\" r=\"1.2\"/><circle cx=\"250\" cy=\"158\" r=\"1.4\"/><circle cx=\"186\" cy=\"164\" r=\"1.2\"/></g>" +
      "<path d=\"M158 152 C 150 160, 146 166, 140 172 M162 152 C 168 160, 176 164, 184 170 M160 154 L160 172\" " + S("stroke:var(--gold);fill:none;opacity:.7") + " stroke-width=\"1\" stroke-linecap=\"round\"/>" +
      "<ellipse cx=\"160\" cy=\"146\" rx=\"11\" ry=\"7.5\" transform=\"rotate(-18 160 146)\" " + S("fill:var(--gold)") + "/>" +
      "<path d=\"M160 140 C 161 128, 158 112, 160 92\" " + STEM + " stroke-width=\"1.8\"/>" +
      "<path d=\"M160 94 C 150 82, 136 80, 128 86 C 136 96, 150 98, 160 94Z\" " + S("fill:var(--sage-soft);stroke:var(--sage-text)") + " stroke-width=\"1.4\"/>" +
      "<path d=\"M160 94 C 170 80, 186 78, 194 84 C 186 95, 172 98, 160 94Z\" " + S("fill:var(--sage-soft);stroke:var(--sage-text)") + " stroke-width=\"1.4\"/>" +
      "</svg>";
  }

  // A plant with one leaf per day (Reset): done = days completed, today = the open day number (or 0)
  function sprout(total, done, today) {
    var s = "<svg class=\"illus\" viewBox=\"0 0 320 200\" style=\"max-width:300px\" aria-label=\"" + done + " of " + total + " days completed\" role=\"img\">";
    s += "<path d=\"M60 186 C 120 176, 200 176, 260 186\" " + STEM + " stroke-width=\"1.4\"/>";
    s += "<path d=\"M160 184 C 158 150, 164 110, 160 " + (176 - total * 20) + "\" " + STEM + " stroke-width=\"2\"/>";
    for (var i = 0; i < total; i++) {
      var y = 168 - i * 20, x = i % 2 === 0 ? -1 : 1;
      var st = i < done ? "d" : (i === today - 1 ? "t" : "f");
      var len = st === "f" ? 30 : 38;
      var style = st === "d" ? "fill:var(--leaf);stroke:var(--sage-text)" :
        st === "t" ? "fill:var(--gold-soft);stroke:var(--gold)" : "fill:none;stroke:var(--line);stroke-dasharray:3 3";
      s += "<path d=\"M160 " + y + " C " + (160 + x * len * .45) + " " + (y - 16) + ", " + (160 + x * len * .9) + " " + (y - 14) + ", " + (160 + x * len) + " " + (y - 4) +
        " C " + (160 + x * len * .8) + " " + (y + 6) + ", " + (160 + x * len * .35) + " " + (y + 6) + ", 160 " + y + "Z\" " + S(style) + " stroke-width=\"1.4\"/>";
    }
    if (done >= total) s += "<circle cx=\"160\" cy=\"" + (172 - total * 20) + "\" r=\"9\" " + S("fill:var(--gold-soft);stroke:var(--gold)") + " stroke-width=\"1.4\"/><circle cx=\"160\" cy=\"" + (172 - total * 20) + "\" r=\"3\" " + S("fill:var(--gold)") + "/>";
    return s + "</svg>";
  }

  // Twenty-one leaves on a trellis (POD): kept = leaves filled; next = the next day (0 if none)
  function vine(kept, next, plain) {
    var s = "<svg class=\"illus\" viewBox=\"0 0 340 270\" style=\"max-width:360px;margin:4px auto 10px\" role=\"img\" aria-label=\"" + kept + " of 21 days kept\">";
    var n = 0;
    [50, 140, 230].forEach(function (y) {
      s += "<path d=\"M14 " + y + " C 70 " + (y - 10) + ", 110 " + (y + 10) + ", 170 " + y + " S 270 " + (y - 10) + ", 326 " + y + "\" " + S("stroke:var(--sage);fill:none;opacity:.8") + " stroke-width=\"1.5\" stroke-linecap=\"round\"/>";
      for (var i = 0; i < 7; i++) {
        n++;
        var x = 36 + i * 44.7, up = i % 2 === 0 ? -1 : 1, ly = y + (up < 0 ? -2 : 2);
        var st = n <= kept ? "d" : (n === next ? "t" : "f");
        var style = st === "d" ? "fill:var(--leaf);stroke:var(--sage-text)" : st === "t" ? "fill:var(--gold-soft);stroke:var(--gold)" : "fill:none;stroke:var(--line)";
        var tcol = st === "f" ? "var(--muted)" : st === "t" ? "var(--gold-text)" : "var(--sage-text)";
        s += "<path d=\"M" + x + " " + ly + " C " + (x - 10) + " " + (ly + up * 9) + ", " + (x - 7) + " " + (ly + up * 24) + ", " + x + " " + (ly + up * 32) +
          " C " + (x + 7) + " " + (ly + up * 24) + ", " + (x + 10) + " " + (ly + up * 9) + ", " + x + " " + ly + "Z\" " + S(style) + " stroke-width=\"1.3\"/>";
        if (!plain) s += "<text x=\"" + x + "\" y=\"" + (y - up * 14) + "\" text-anchor=\"middle\" dominant-baseline=\"middle\" " + S("font:600 9.5px Inter,Arial,sans-serif;fill:" + tcol + (st === "f" ? ";opacity:.7" : "")) + ">" + n + "</text>";
      }
    });
    return s + "</svg>";
  }

  // Eight petals for eight dimensions (assessment results): dims = [[label, score], ...]
  function flower(dims, overall) {
    var s = "<svg class=\"illus\" viewBox=\"-222 -196 444 392\" style=\"max-width:440px\" role=\"img\" aria-label=\"Your eight dimensions\">";
    s += "<circle r=\"150\" " + S("fill:none;stroke:var(--line)") + " stroke-dasharray=\"2 5\"/><circle r=\"100\" " + S("fill:none;stroke:var(--line)") + " stroke-dasharray=\"2 5\"/>";
    dims.forEach(function (d, i) {
      var a = i * (360 / dims.length), L = 40 + d[1] * 1.05, w = Math.max(16, L * .28), low = d[1] < 40;
      var style = low ? "fill:var(--gold-soft);stroke:var(--gold)" : "fill:var(--leaf);stroke:var(--sage-text)";
      s += "<g class=\"petal\" data-i=\"" + i + "\" tabindex=\"0\" role=\"button\" aria-label=\"" + d[0] + ", " + d[1] + "\" transform=\"rotate(" + a + ")\" style=\"cursor:pointer\">" +
        "<path d=\"M0 -22 C " + w + " " + (-22 - L * .35) + ", " + (w * .9) + " " + (-22 - L * .85) + ", 0 " + (-22 - L) + " C " + (-w * .9) + " " + (-22 - L * .85) + ", " + (-w) + " " + (-22 - L * .35) + ", 0 -22Z\" " + S(style) + " stroke-width=\"1.4\"/>" +
        "<path d=\"M0 -24 L0 " + (-20 - L * .9) + "\" " + S((low ? "stroke:var(--gold)" : "stroke:var(--sage-text)") + ";opacity:.55") + " stroke-width=\".8\"/></g>";
      var r = 178, x = Math.sin(a * Math.PI / 180) * r, y = -Math.cos(a * Math.PI / 180) * r;
      s += "<text x=\"" + x + "\" y=\"" + y + "\" text-anchor=\"middle\" dominant-baseline=\"middle\" " + S("font:600 14px Inter,Arial,sans-serif;fill:var(--muted)") + ">" + d[0] + "</text>";
    });
    s += "<circle r=\"27\" " + S("fill:var(--gold)") + "/><text y=\"2\" text-anchor=\"middle\" dominant-baseline=\"middle\" " + S("font:600 25px 'Cormorant Garamond',Georgia,serif;fill:#fffdf8") + ">" + overall + "</text>";
    return s + "</svg>";
  }

  // A small stem that grows with progress (assessment questions): pct 0..100
  function stem(pct) {
    var h = 4 + pct * 0.56;
    return "<svg viewBox=\"0 0 40 64\" width=\"28\" height=\"44\" aria-hidden=\"true\"><path d=\"M20 62 L20 " + (62 - h) + "\" " + STEM + " stroke-width=\"2\"/>" +
      (pct > 30 ? "<path d=\"M20 46 C 13 42, 9 38, 8 33 C 14 33, 18 38, 20 46Z\" " + S("fill:var(--leaf);stroke:var(--sage-text)") + " stroke-width=\"1.1\"/>" : "") +
      (pct > 60 ? "<path d=\"M20 34 C 27 30, 31 26, 32 21 C 26 21, 22 26, 20 34Z\" " + S("fill:var(--leaf);stroke:var(--sage-text)") + " stroke-width=\"1.1\"/>" : "") +
      (pct >= 100 ? "<circle cx=\"20\" cy=\"6\" r=\"4\" " + S("fill:var(--gold)") + "/>" : "") + "</svg>";
  }

  window.GardenArt = { ornament: ornament, seed: seed, sprout: sprout, vine: vine, flower: flower, stem: stem };

  // Fill any placeholder <span class="art-ornament"></span>
  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.querySelectorAll(".ornament"), function (el) { if (!el.innerHTML.trim()) el.innerHTML = ornament(); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-art='seed']"), function (el) { el.innerHTML = seed(); });
  });
})();
