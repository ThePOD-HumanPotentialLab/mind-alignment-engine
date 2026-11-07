/* Calendar reminders (.ics) for the 7-Day Mind Reset.
   GET /api/reset/calendar.ics?start=YYYY-MM-DD&count=N&morning=HH:MM&evening=HH:MM&tz=IANA&tzo=MINUTES
   start is the phone's own date. Each day is its own event, timed in the phone's time zone (tz),
   so reminders stay right across daylight-saving changes; tzo (getTimezoneOffset) is the fallback.
   UIDs depend only on the date and the moment, so adding again replaces rather than duplicates.
   Holds no personal data, so it needs no token. */

// Minutes the zone is ahead of UTC at a given instant (Lagos = 60).
function zoneOffset(tz, ms) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .formatToParts(new Date(ms)).reduce((a, p) => (a[p.type] = p.value, a), {});
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  return Math.round((asUtc - Math.floor(ms / 60000) * 60000) / 60000);
}

function validZone(tz) {
  if (!tz || tz.length > 64) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch (e) { return false; }
}

function stamp(ms) {
  return new Date(ms).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
}

function text(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// Lines must be at most 75 octets; fold by bytes so non-ASCII text stays valid.
const enc = new TextEncoder();
function fold(lines) {
  return lines.map(l => {
    let out = "", cur = "", bytes = 0;
    for (const ch of l) {
      const b = enc.encode(ch).length;
      if (bytes + b > 73) { out += cur + "\r\n "; cur = ""; bytes = 1; }
      cur += ch; bytes += b;
    }
    return out + cur;
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
  const tz = validZone(q.get("tz")) ? q.get("tz") : null;
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
      desc: "About 10 minutes: read today's law, breathe for one minute, and plant your intention for the practice.\nOpen the Reset: " + link +
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
  for (let i = 0; i < count; i++) for (const e of events) {
    const local = day0 + i * 86400000 + e.at * 60000;         // the wall-clock time, as if it were UTC
    let t = local + tzo * 60000;
    if (tz) { t = local - zoneOffset(tz, local) * 60000; t = local - zoneOffset(tz, t) * 60000; }
    const date = new Date(day0 + i * 86400000).toISOString().slice(0, 10);
    lines.push(
      "BEGIN:VEVENT",
      "UID:reset-" + e.key + "-" + date + "@thepod",
      "DTSTAMP:" + stamp(Date.now()),
      "DTSTART:" + stamp(t),
      "DTEND:" + stamp(t + e.mins * 60000),
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
