/* Calendar reminders (.ics) for the 7-Day Mind Reset.
   GET /api/reset/calendar.ics?start=YYYY-MM-DD&count=N&morning=HH:MM&evening=HH:MM&tzo=MINUTES
   tzo is the phone's getTimezoneOffset() (Lagos = -60), so the times are right outside Nigeria too.
   Holds no personal data, so it needs no token. */

function stamp(ms) {
  return new Date(ms).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
}

function text(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function fold(lines) {
  return lines.map(l => {
    let out = "";
    while (l.length > 73) { out += l.slice(0, 73) + "\r\n "; l = l.slice(73); }
    return out + l;
  }).join("\r\n") + "\r\n";
}

function minutesOf(t, lo, hi) {
  if (!/^\d{2}:\d{2}$/.test(t || "")) return null;
  const [h, m] = t.split(":").map(Number);
  const n = h * 60 + m;
  return m % 30 === 0 && n >= lo && n <= hi ? n : null;
}

export function handleResetCalendar(request, url) {
  if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
  const q = url.searchParams;
  const start = q.get("start") || "";
  const count = Math.round(Number(q.get("count")));
  const tzo = Math.round(Number(q.get("tzo") || -60));
  const morning = minutesOf(q.get("morning"), 4 * 60, 11 * 60 + 30);
  const evening = minutesOf(q.get("evening"), 17 * 60, 23 * 60 + 30);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !(count >= 1 && count <= 7) || !(tzo >= -840 && tzo <= 720) || morning === null || evening === null) {
    return new Response("Invalid reminder request.", { status: 400 });
  }
  const day0 = Date.parse(start + "T00:00:00Z");
  if (Number.isNaN(day0)) return new Response("Invalid date.", { status: 400 });
  const link = url.origin + "/reset";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The POD Human Potential Lab//7-Day Mind Reset//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  const events = [
    {
      key: "morning", at: morning, mins: 15,
      title: "7-Day Mind Reset: morning reading",
      desc: "About 10 minutes: read today's law, breathe for one minute, and set your intention for the practice.\nOpen the Reset: " + link +
        "\nIf you missed yesterday, simply continue where you stopped.",
      alarm: "Your Mind Reset reading is ready. Ten minutes, before the day takes over."
    },
    {
      key: "evening", at: evening, mins: 15,
      title: "7-Day Mind Reset: evening reflection",
      desc: "Five to ten quiet minutes: re-read today's law, write your reflection honestly, and complete the day.\nOpen the Reset: " + link,
      alarm: "Time for your evening reflection. Write what the day showed you."
    }
  ];
  for (const e of events) {
    const t = day0 + (e.at + tzo) * 60000;
    lines.push(
      "BEGIN:VEVENT",
      "UID:reset-" + e.key + "-" + start + "-" + count + "-" + e.at + "@thepod",
      "DTSTAMP:" + stamp(Date.now()),
      "DTSTART:" + stamp(t),
      "DTEND:" + stamp(t + e.mins * 60000),
      "RRULE:FREQ=DAILY;COUNT=" + count,
      "SUMMARY:" + text(e.title),
      "DESCRIPTION:" + text(e.desc),
      "URL:" + link,
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + text(e.alarm), "TRIGGER:PT0M", "END:VALARM",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return new Response(fold(lines), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=\"mind-reset-reminders.ics\"",
      "Cache-Control": "no-store"
    }
  });
}
