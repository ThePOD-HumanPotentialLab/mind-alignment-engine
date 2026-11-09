/* Phone alerts for Josh, through the free ntfy app (ntfy.sh).
   Set the secret NTFY_TOPIC to a long random topic name and subscribe to it in the app.
   Without the secret, nothing is sent. Alerts carry only a first name, the item, the amount
   and the reference: full contact details stay on the admin pages. Never blocks or breaks a request. */
export async function notifyJosh(env, { title, message, click, tags }) {
  const topic = String(env.NTFY_TOPIC || "").trim();
  if (!/^[A-Za-z0-9_-]{12,64}$/.test(topic)) return;
  try {
    const headers = { "Title": ascii(title), "Priority": "high", "Tags": tags || "bell" };
    if (click) headers["Click"] = click;
    const server = /^https?:\/\/[a-z0-9.:-]+$/i.test(env.NTFY_SERVER || "") ? env.NTFY_SERVER : "https://ntfy.sh";
    await fetch(server + "/" + topic, { method: "POST", body: message, headers, signal: AbortSignal.timeout(4000) });
  } catch (e) { /* an alert must never stop a registration */ }
}

export const firstName = n => String(n || "").trim().split(/\s+/)[0].slice(0, 30) || "Someone";
export const naira = n => "₦" + Number(n).toLocaleString("en-NG");
// HTTP header values must be plain ASCII.
const ascii = s => String(s).replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/[^\x20-\x7E]/g, "").slice(0, 120);
