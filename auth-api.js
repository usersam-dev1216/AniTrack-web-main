// AniTrack Unified API Worker (Auth + List) — D1 + Cookie Sessions
// Binding required: DB (D1 database)
// Optional env var: ALLOWED_ORIGINS="https://usersam-dev1216.github.io,http://localhost:5500"
// Optional env var: COOKIE_NAME="anitrack_session"

const DEFAULT_ALLOWED = ["https://usersam-dev1216.github.io", "http://localhost:5500"];
const DEFAULT_COOKIE_NAME = "anitrack_session";
const SESSION_DAYS = 30;

// ---------- Utils ----------
function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function parseAllowed(env) {
  const raw = (env.ALLOWED_ORIGINS || "").trim();
  if (!raw) return DEFAULT_ALLOWED;
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function corsHeaders(env, request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = parseAllowed(env);
  const ok = allowed.includes(origin);
  const allowOrigin = ok ? origin : allowed[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type",
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

function bad(msg, status = 400, headers = {}) {
  return json({ ok: false, error: msg }, status, headers);
}

function ok(data = {}, headers = {}) {
  return json({ ok: true, ...data }, 200, headers);
}

function getCookie(request, name) {
  const c = request.headers.get("Cookie") || "";
  // simple cookie parse
  const parts = c.split(/;\s*/);
  for (const p of parts) {
    const i = p.indexOf("=");
    if (i === -1) continue;
    const k = p.slice(0, i).trim();
    if (k === name) return decodeURIComponent(p.slice(i + 1));
  }
  return null;
}

function makeCookie(name, value, maxAgeSec) {
  // Secure cookies require HTTPS (Workers default). If you test on http://localhost, browser may ignore Secure.
  // Keep Secure for production; you can temporarily remove Secure for local dev if needed.
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAgeSec}`,
    "Path=/",
    "HttpOnly",
    "SameSite=None",
    "Secure",
  ];
  return attrs.join("; ");
}

function clearCookie(name) {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=None; Secure`;
}

function base64url(bytes) {
  let bin = "";
  const u8 = new Uint8Array(bytes);
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function utf8(s) {
  return new TextEncoder().encode(s);
}

async function pbkdf2(passBytes, saltBytes, iterations, lengthBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passBytes,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations },
    keyMaterial,
    lengthBytes * 8
  );

  return new Uint8Array(bits);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  return out === 0;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// pass_hash format: "pbkdf2_sha256$<iters>$<saltB64url>$<dkB64url>"
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iters = 100000; // robust but still reasonable
  const dk = await pbkdf2(utf8(password), salt, iters, 32);
  return `pbkdf2_sha256$${iters}$${base64url(salt)}$${base64url(dk)}`;
}

async function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4) return false;
  const [algo, itStr, saltB64, dkB64] = parts;
  if (algo !== "pbkdf2_sha256") return false;
  const iters = Number(itStr);
  if (!Number.isFinite(iters) || iters < 10000) return false;

  // decode base64url
  const salt = b64urlToU8(saltB64);
  const expected = b64urlToU8(dkB64);

  const got = await pbkdf2(utf8(password), salt, iters, expected.length);
  // compare as strings to reuse timingSafeEqual
  return timingSafeEqual(base64url(got), base64url(expected));
}

function b64urlToU8(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sha256Hex(s) {
  const digest = await crypto.subtle.digest("SHA-256", utf8(s));
  const u8 = new Uint8Array(digest);
  let hex = "";
  for (const b of u8) hex += b.toString(16).padStart(2, "0");
  return hex;
}

// ---------- Auth: sessions ----------
async function createSession(env, userId) {
  const sidBytes = crypto.getRandomValues(new Uint8Array(18));
  const secretBytes = crypto.getRandomValues(new Uint8Array(24));
  const sid = base64url(sidBytes);
  const secret = base64url(secretBytes);

  const secretHash = await sha256Hex(secret);
  const created = nowSec();
  const expires = created + SESSION_DAYS * 24 * 60 * 60;

  await env.DB.prepare(
    `INSERT INTO sessions (sid, user_id, secret_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(sid, userId, secretHash, expires, created).run();

  return { sid, secret, expires };
}

async function requireUser(env, request) {
  const cookieName = (env.COOKIE_NAME || DEFAULT_COOKIE_NAME).trim() || DEFAULT_COOKIE_NAME;
  const v = getCookie(request, cookieName);
  if (!v || !v.includes(".")) return null;

  const [sid, secret] = v.split(".", 2);
  if (!sid || !secret) return null;

  const row = await env.DB.prepare(
    `SELECT user_id, secret_hash, expires_at FROM sessions WHERE sid = ?`
  ).bind(sid).first();

  if (!row) return null;
  if (Number(row.expires_at) <= nowSec()) return null;

  const secretHash = await sha256Hex(secret);
  if (!timingSafeEqual(String(row.secret_hash), secretHash)) return null;

  return Number(row.user_id);
}

async function maybePurgeExpiredSessions(env) {
  // 1% chance per request, cheap cleanup
  if ((crypto.getRandomValues(new Uint8Array(1))[0] % 100) !== 0) return;
  await env.DB.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).bind(nowSec()).run();
}

// ---------- Router ----------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(env, request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    await maybePurgeExpiredSessions(env);

    // Health
    if (request.method === "GET" && url.pathname === "/") {
      return ok({ service: "anitrack-api", time: nowSec() }, cors);
    }

    // --------------------
    // AUTH: SIGNUP
    // POST /auth/signup  { email, password }
    // --------------------
    if (request.method === "POST" && url.pathname === "/auth/signup") {
      const body = await request.json().catch(() => null);
      if (!body) return bad("invalid_json", 400, cors);

      const email = normalizeEmail(body.email);
      const password = String(body.password || "");
      const username = String(body.username || "").trim();


      if (!username) return bad("missing_username", 400, cors);
if (username.length < 3 || username.length > 24) return bad("invalid_username_length", 400, cors);
if (!/^[a-zA-Z0-9_]+$/.test(username)) return bad("invalid_username_chars", 400, cors);


      if (!email.includes("@") || email.length > 254) return bad("invalid_email", 400, cors);
      if (password.length < 8 || password.length > 200) return bad("weak_password", 400, cors);

      const existingEmail = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`)
  .bind(email).first();
if (existingEmail) return bad("email_in_use", 409, cors);

const existingUser = await env.DB.prepare(`SELECT id FROM users WHERE username = ?`)
  .bind(username).first();
if (existingUser) return bad("username_in_use", 409, cors);


      const pass_hash = await hashPassword(password);
      const t = nowSec();

      await env.DB.prepare(
  `INSERT INTO users (email, username, pass_hash, created_at) VALUES (?, ?, ?, ?)`
).bind(email, username, pass_hash, t).run();

// Don't rely on meta.last_row_id; fetch the created user id reliably
const created = await env.DB.prepare(
  `SELECT id, email, username FROM users WHERE email = ?`
).bind(email).first();

if (!created || !created.id) return bad("signup_failed", 500, cors);

const userId = Number(created.id);

const sess = await createSession(env, userId);
const cookieName = (env.COOKIE_NAME || DEFAULT_COOKIE_NAME).trim() || DEFAULT_COOKIE_NAME;
const setCookie = makeCookie(cookieName, `${sess.sid}.${sess.secret}`, SESSION_DAYS * 24 * 60 * 60);

return ok(
  { user: { id: userId, email: created.email, username: created.username } },
  { ...cors, "Set-Cookie": setCookie }
);
    }

    // --------------------
    // AUTH: LOGIN
    // POST /auth/login  { email, password }
    // --------------------
    if (request.method === "POST" && url.pathname === "/auth/login") {
      const body = await request.json().catch(() => null);
      if (!body) return bad("invalid_json", 400, cors);

      const email = normalizeEmail(body.email);
      const password = String(body.password || "");
      if (!email || !password) return bad("missing_fields", 400, cors);

      const created = await env.DB.prepare(
  `SELECT id, email, username FROM users WHERE email = ?`
).bind(email).first();


      // do not reveal whether email exists
      if (!user) return bad("invalid_credentials", 401, cors);

      const okPass = await verifyPassword(password, user.pass_hash);
      if (!okPass) return bad("invalid_credentials", 401, cors);

      const userId = Number(user.id);
      const sess = await createSession(env, userId);

      const cookieName = (env.COOKIE_NAME || DEFAULT_COOKIE_NAME).trim() || DEFAULT_COOKIE_NAME;
      const setCookie = makeCookie(cookieName, `${sess.sid}.${sess.secret}`, SESSION_DAYS * 24 * 60 * 60);

      return ok(
        { user: { id: userId, email: user.email } },
        { ...cors, "Set-Cookie": setCookie }
      );
    }

    // --------------------
    // AUTH: ME
    // GET /auth/me
    // --------------------
    if (request.method === "GET" && url.pathname === "/auth/me") {
      const userId = await requireUser(env, request);
      if (!userId) return bad("not_logged_in", 401, cors);

  const user = await env.DB.prepare(`SELECT id, email, username, created_at FROM users WHERE id = ?`)
  .bind(userId).first();


      if (!user) return bad("not_logged_in", 401, cors);
      return ok({ user }, cors);
    }

    // --------------------
    // AUTH: LOGOUT
    // POST /auth/logout
    // --------------------
    if (request.method === "POST" && url.pathname === "/auth/logout") {
      const cookieName = (env.COOKIE_NAME || DEFAULT_COOKIE_NAME).trim() || DEFAULT_COOKIE_NAME;
      const v = getCookie(request, cookieName);

      if (v && v.includes(".")) {
        const [sid] = v.split(".", 2);
        if (sid) {
          await env.DB.prepare(`DELETE FROM sessions WHERE sid = ?`).bind(sid).run();
        }
      }

      return ok({}, { ...cors, "Set-Cookie": clearCookie(cookieName) });
    }

    // --------------------
    // LIST: GET
    // GET /list
    // --------------------
    if (request.method === "GET" && url.pathname === "/list") {
      const userId = await requireUser(env, request);
      if (!userId) return bad("unauthorized", 401, cors);

      const rows = await env.DB.prepare(
        `SELECT mal_id, status, created_at, updated_at
         FROM user_anime_list
         WHERE user_id = ?
         ORDER BY updated_at DESC`
      ).bind(userId).all();

      return ok({ items: rows.results || [] }, cors);
    }

    // --------------------
    // LIST: UPSERT
    // POST /list/upsert  { malId, status }
    // --------------------
    if (request.method === "POST" && url.pathname === "/list/upsert") {
      const userId = await requireUser(env, request);
      if (!userId) return bad("unauthorized", 401, cors);

      const body = await request.json().catch(() => null);
      if (!body) return bad("invalid_json", 400, cors);

      const malId = Number(body.malId);
      const status = String(body.status || "").trim() || "Plan to Watch";
      if (!Number.isFinite(malId) || malId <= 0) return bad("invalid_malId", 400, cors);
      if (status.length > 40) return bad("invalid_status", 400, cors);

      const t = nowSec();

      await env.DB.prepare(
        `INSERT INTO user_anime_list (user_id, mal_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, mal_id) DO UPDATE SET
           status = excluded.status,
           updated_at = excluded.updated_at`
      ).bind(userId, malId, status, t, t).run();

      return ok({ malId, status }, cors);
    }

    // --------------------
    // LIST: DELETE
    // DELETE /list/:malId
    // --------------------
    if (request.method === "DELETE" && url.pathname.startsWith("/list/")) {
      const userId = await requireUser(env, request);
      if (!userId) return bad("unauthorized", 401, cors);

      const malId = Number(url.pathname.slice("/list/".length));
      if (!Number.isFinite(malId) || malId <= 0) return bad("invalid_malId", 400, cors);

      await env.DB.prepare(
        `DELETE FROM user_anime_list WHERE user_id = ? AND mal_id = ?`
      ).bind(userId, malId).run();

      return ok({ malId }, cors);
    }

    // --------------------
    // LIST: REPLACE (bulk)
    // POST /list/replace  { ids: number[], status? }
    // --------------------
    if (request.method === "POST" && url.pathname === "/list/replace") {
      const userId = await requireUser(env, request);
      if (!userId) return bad("unauthorized", 401, cors);

      const body = await request.json().catch(() => null);
      if (!body) return bad("invalid_json", 400, cors);

      const ids = Array.isArray(body.ids) ? body.ids : [];
      const status = String(body.status || "Plan to Watch").trim();
      if (status.length > 40) return bad("invalid_status", 400, cors);

      const clean = [...new Set(ids.map(Number).filter(n => Number.isFinite(n) && n > 0))];
      const t = nowSec();

      // wipe current list
      await env.DB.prepare(`DELETE FROM user_anime_list WHERE user_id = ?`).bind(userId).run();

      // insert new list
      for (const malId of clean) {
        await env.DB.prepare(
          `INSERT INTO user_anime_list (user_id, mal_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(userId, malId, status, t, t).run();
      }

      return ok({ count: clean.length }, cors);
    }

    return bad("not_found", 404, cors);
  },
};
