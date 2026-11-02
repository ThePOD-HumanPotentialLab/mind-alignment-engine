/* ---------------- Paystack: shared key handling ----------------
   PAYSTACK_SECRET_KEY       live key (sk_live_...) used by production
   PAYSTACK_TEST_SECRET_KEY  test key (sk_test_...) used when PAYSTACK_MODE = "test"
   Staging previews set PAYSTACK_MODE = "test" in wrangler.jsonc, so they can never take real money. */

export function paystackKey(env) {
  if (env.PAYSTACK_MODE === "test") return env.PAYSTACK_TEST_SECRET_KEY || "";
  return env.PAYSTACK_SECRET_KEY || "";
}

export function paystackBase(env) {
  return env.PAYSTACK_API_BASE || "https://api.paystack.co";
}

async function hmacHex(secret, raw) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, "0")).join("");
}

function sameString(a, b) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/* Paystack signs each webhook with the secret key of the mode it came from,
   so production accepts only live webhooks and staging only test ones. */
export async function validWebhookSignature(env, raw, given) {
  const signature = String(given || "").toLowerCase();
  const secret = paystackKey(env);
  if (!signature || !secret) return false;
  return sameString(await hmacHex(secret, raw), signature);
}

export async function paystackInitialize(env, payload) {
  const res = await fetch(paystackBase(env) + "/transaction/initialize", {
    method: "POST",
    headers: { Authorization: "Bearer " + paystackKey(env), "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.status || !body?.data?.authorization_url) return null;
  return body.data;
}

export async function paystackVerify(env, reference) {
  const res = await fetch(paystackBase(env) + "/transaction/verify/" + encodeURIComponent(reference), {
    headers: { Authorization: "Bearer " + paystackKey(env) }
  });
  const body = await res.json().catch(() => null);
  return res.ok && body?.status && body.data ? body.data : null;
}
