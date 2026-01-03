// anitrack-list worker (D1 + JWT auth)

const ALLOWED_ORIGIN = "https://usersam-dev1216.github.io";

function cors(origin) {
  const o = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Vary": "Origin",
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

// ---- Minimal HS256 JWT verify (WebCrypto) ----
function b64urlToU8(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s + pad);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
function u8ToB64url(u8) {
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function hmacSHA256(keyStr, msgStr) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyStr),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msgStr));
  return new Uint8Array(sig);
}
async function verifyJWT(token, secret) {
  // token = header.payload.signature (HS256)
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;

  const header = JSON.parse(new TextDecoder().decode(b64urlToU8(h)));
  if (header.alg !== "HS256") return null;

  const payload = JSON.parse(new TextDecoder().decode(b64urlToU8(p)));

  // exp check
  const t = nowSec();
  if (typeof payload.exp === "number" && payload.exp < t) return null;
  if (!payload.sub) return null;

  // signature check
  const msg = `${h}.${p}`;
  const sig = b64urlToU8(s);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(msg));
  if (!ok) return null;

  return payload; // { sub: userId, ... }
}

async function requireUserId(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const payload = await verifyJWT(m[1], env.LIST_JWT_SECRET);
  return payload ? String(payload.sub) : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    // Auth
    const userId = await requireUserId(request, env);
    if (!userId) {
      return json({ ok: false, error: "unauthorized" }, 401, cors(origin));
    }

    // Routes
    // GET /list
    if (request.method === "GET" && url.pathname === "/list") {
      const rows = await env.LIST_DB.prepare(
        `SELECT mal_id, status, created_at, updated_at
         FROM user_anime_list
         WHERE user_id = ?
         ORDER BY updated_at DESC`
      ).bind(userId).all();

      return json({ ok: true, items: rows.results || [] }, 200, cors(origin));
    }

    // POST /list/add  { malId, status? }
    if (request.method === "POST" && url.pathname === "/list/add") {
      const body = await request.json().catch(() => ({}));
      const malId = Number(body.malId);
      const status = String(body.status || "Plan to Watch");
      if (!Number.isFinite(malId) || malId <= 0) {
        return json({ ok: false, error: "invalid_malId" }, 400, cors(origin));
      }

      const t = nowSec();
      await env.LIST_DB.prepare(
        `INSERT INTO user_anime_list (user_id, mal_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, mal_id) DO UPDATE SET
           status = excluded.status,
           updated_at = excluded.updated_at`
      ).bind(userId, malId, status, t, t).run();

      return json({ ok: true }, 200, cors(origin));
    }

    // POST /list/status { malId, status }
    if (request.method === "POST" && url.pathname === "/list/status") {
      const body = await request.json().catch(() => ({}));
      const malId = Number(body.malId);
      const status = String(body.status || "");
      if (!Number.isFinite(malId) || malId <= 0) return json({ ok:false, error:"invalid_malId" }, 400, cors(origin));
      if (!status) return json({ ok:false, error:"missing_status" }, 400, cors(origin));

      const t = nowSec();
      const r = await env.LIST_DB.prepare(
        `UPDATE user_anime_list
         SET status = ?, updated_at = ?
         WHERE user_id = ? AND mal_id = ?`
      ).bind(status, t, userId, malId).run();

      return json({ ok: true, changed: r.changes || 0 }, 200, cors(origin));
    }

    // DELETE /list/:malId
    const del = url.pathname.match(/^\/list\/(\d+)$/);
    if (request.method === "DELETE" && del) {
      const malId = Number(del[1]);
      const r = await env.LIST_DB.prepare(
        `DELETE FROM user_anime_list WHERE user_id = ? AND mal_id = ?`
      ).bind(userId, malId).run();

      return json({ ok: true, deleted: r.changes || 0 }, 200, cors(origin));
    }

    return json({ ok: false, error: "not_found" }, 404, cors(origin));
  },
};
