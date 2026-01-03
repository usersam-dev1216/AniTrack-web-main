// AniTrack Auth Worker (D1) — Signup/Login/Me/Logout + cookie sessions
// Required binding: AUTH_DB (D1 database)
// Optional env var: ALLOWED_ORIGINS="https://site.com,http://localhost:5500"

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

// ---------- Base64url helpers ----------
function base64urlFromBytes(u8) {
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesFromBase64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sha256Base64url(str) {
  const data = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64urlFromBytes(new Uint8Array(digest));
}

// ---------- CORS ----------
function parseAllowedOrigins(env) {
  const raw = (env.ALLOWED_ORIGINS || "").trim();
  if (!raw) return [];
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

function corsHeaders(req, env) {
  const origin = req.headers.get("Origin");
  if (!origin) return {};
  const allowed = parseAllowedOrigins(env);
  if (allowed.length === 0) return {};
  if (!allowed.includes(origin)) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}


function u8ToB64url(u8) {
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signHS256(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return u8ToB64url(new Uint8Array(sig));
}

async function mintListJWT(env, userId, ttlSeconds = 3600) {
  const header = u8ToB64url(
    new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  );
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = u8ToB64url(
    new TextEncoder().encode(JSON.stringify({ sub: String(userId), exp }))
  );
  const msg = `${header}.${payload}`;
  const sig = await signHS256(env.LIST_JWT_SECRET, msg);
  return `${msg}.${sig}`;
}




// ---------- Cookies ----------
function getCookie(req, name) {
  const c = req.headers.get("Cookie") || "";
  const parts = c.split(";").map(x => x.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}


async function getUserFromSession(req, env) {
  const v = getCookie(req, "anitrack_session");
  if (!v || !v.includes(".")) return null;

  const [sid, secret] = v.split(".", 2);
  if (!sid || !secret) return null;

  const secretHash = await sha256Base64url(secret);
  const t = nowSec();

  const row = await env.AUTH_DB.prepare(
    `SELECT
       s.user_id, s.expires_at, s.revoked_at,
       u.username, u.email, u.email_verified_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.session_secret_hash = ?
     LIMIT 1`
  ).bind(sid, secretHash).first();

  if (!row) return null;
  if (row.revoked_at) return null;
  if (row.expires_at <= t) return null;

  // keep session fresh
  try {
    await env.AUTH_DB.prepare(`UPDATE sessions SET last_seen_at = ? WHERE id = ?`)
      .bind(t, sid).run();
  } catch {}

  return {
    id: row.user_id,
    username: row.username,
    email: row.email,
    emailVerified: !!row.email_verified_at,
  };
}


// NOTE: SameSite=None is needed if your site is on a different domain than the worker.
// (If you later move the worker onto the same domain, you can change to Lax.)
function makeCookie(name, value, maxAgeSec) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAgeSec}`;
}
function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}

// ---------- Password hashing (PBKDF2) ----------
// Stored format:
// pbkdf2$sha256$310000$<salt_b64url>$<dk_b64url>
async function hashPassword(password) {
  const iterations = 100000;
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    keyMaterial,
    256
  );

  const saltB64 = base64urlFromBytes(salt);
  const dkB64 = base64urlFromBytes(new Uint8Array(bits));
  return `pbkdf2$sha256$${iterations}$${saltB64}$${dkB64}`;
}

async function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 5) return false;

  const [kind, algo, itersStr, saltB64, dkB64] = parts;
  if (kind !== "pbkdf2" || algo !== "sha256") return false;

  const iterations = parseInt(itersStr, 10);
  if (!Number.isFinite(iterations) || iterations < 50000) return false;

  const salt = bytesFromBase64url(saltB64);
  const expected = bytesFromBase64url(dkB64);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    keyMaterial,
    256
  );

  const actual = new Uint8Array(bits);

  // constant-time compare
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= (actual[i] ^ expected[i]);
  return diff === 0;
}

export default {
  async fetch(req, env) {
    const cors = corsHeaders(req, env);

    try {
      const url = new URL(req.url);

      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
      }

      if (!env.AUTH_DB) {
        return json(
  { ok: true },
  200,
  { ...cors, "Set-Cookie": makeCookie("anitrack_session", cookieValue, maxAge) }
);

      }

      // Enable FK (safe)
      try { await env.AUTH_DB.prepare("PRAGMA foreign_keys = ON;").run(); } catch {}

      // --------------------
      // HEALTH
      // --------------------
      if (req.method === "GET" && url.pathname === "/health") {
        const r = await env.AUTH_DB
          .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
          .all();
        return json({ ok: true, tables: r.results.map(x => x.name) }, 200, cors);
      }

      // --------------------
      // SIGNUP
      // POST /auth/signup { username, email, password }
      // --------------------
      if (req.method === "POST" && url.pathname === "/auth/signup") {
        const body = await req.json().catch(() => null);

        const username = String(body?.username || "").trim();
        const email = String(body?.email || "").trim();
        const password = String(body?.password ?? "");

        if (username.length < 3) return json({ ok: false, error: "username_too_short" }, 400, cors);
        if (!email.includes("@")) return json({ ok: false, error: "invalid_email" }, 400, cors);
        if (password.length < 8) return json({ ok: false, error: "password_too_short" }, 400, cors);

        const id = crypto.randomUUID();
        const usernameLower = username.toLowerCase();
        const emailLower = email.toLowerCase();
        const t = nowSec();

        const passwordHash = await hashPassword(password);

        try {
          await env.AUTH_DB.prepare(
            `INSERT INTO users (
              id, username, username_lower,
              email, email_lower,
              password_hash, password_algo,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pbkdf2', ?, ?)`
          ).bind(id, username, usernameLower, email, emailLower, passwordHash, t, t).run();

          // optional: assign default role if roles are seeded
          try {
            await env.AUTH_DB.prepare(
              `INSERT INTO user_roles (user_id, role_id, created_at)
               SELECT ?, id, ? FROM roles WHERE name='user'`
            ).bind(id, t).run();
          } catch {}

          return json({ ok: true, userId: id }, 200, cors);
        } catch (e) {
          const msg = String(e?.message || e);

          if (msg.includes("idx_users_username_lower")) return json({ ok: false, error: "username_taken" }, 409, cors);
          if (msg.includes("idx_users_email_lower")) return json({ ok: false, error: "email_taken" }, 409, cors);

          return json({ ok: false, error: "signup_failed", detail: msg }, 500, cors);
        }
      }

      // --------------------
      // LOGIN
      // POST /auth/login { identifier, password }
      // identifier = email OR username
      // Sets cookie: anitrack_session = sid.secret
      // --------------------
      if (req.method === "POST" && url.pathname === "/auth/login") {
        const body = await req.json().catch(() => null);

        const identifier = String(body?.identifier || "").trim();
        const password = String(body?.password ?? "");
        if (!identifier || !password) return json({ ok: false, error: "missing_fields" }, 400, cors);

        const identLower = identifier.toLowerCase();

        const u = await env.AUTH_DB.prepare(
          `SELECT id, password_hash, is_disabled
           FROM users
           WHERE email_lower = ? OR username_lower = ?
           LIMIT 1`
        ).bind(identLower, identLower).first();

        if (!u) return json({ ok: false, error: "invalid_login" }, 401, cors);
        if (u.is_disabled) return json({ ok: false, error: "account_disabled" }, 403, cors);

        const ok = await verifyPassword(password, u.password_hash);
        if (!ok) return json({ ok: false, error: "invalid_login" }, 401, cors);

        // Create session
        const sid = crypto.randomUUID();
        const secret = base64urlFromBytes(crypto.getRandomValues(new Uint8Array(32)));
        const secretHash = await sha256Base64url(secret);

        const created = nowSec();
        const maxAge = 60 * 60 * 24 * 30; // 30 days
        const expires = created + maxAge;

        await env.AUTH_DB.prepare(
          `INSERT INTO sessions (
            id, user_id, session_secret_hash,
            created_at, expires_at, last_seen_at,
            ip, user_agent
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          sid, u.id, secretHash,
          created, expires, created,
          req.headers.get("CF-Connecting-IP") || null,
          req.headers.get("User-Agent") || null
        ).run();

        const cookieValue = `${sid}.${secret}`;
        return json(
          { ok: true },
          200,
          { ...cors, "Set-Cookie": makeCookie("anitrack_session", cookieValue, maxAge) }
        );
      }

// --------------------
// ME
// GET /auth/me
// --------------------
if (req.method === "GET" && url.pathname === "/auth/me") {
  const user = await getUserFromSession(req, env);
  if (!user) return json({ ok: false, error: "not_logged_in" }, 401, cors);
  return json({ ok: true, user }, 200, cors);
}



// --------------------
// LIST TOKEN (for separate list API)
// GET /auth/list-token
// --------------------
if (req.method === "GET" && url.pathname === "/auth/list-token") {
  if (!env.LIST_JWT_SECRET) {
    return json({ ok: false, error: "missing_LIST_JWT_SECRET" }, 500, cors);
  }

  const user = await getUserFromSession(req, env);
  if (!user) return json({ ok: false, error: "not_logged_in" }, 401, cors);

  const token = await mintListJWT(env, user.id, 3600); // 1 hour
  return json({ ok: true, token }, 200, cors);
}



      // --------------------
      // LOGOUT
      // POST /auth/logout
      // --------------------
      if (req.method === "POST" && url.pathname === "/auth/logout") {
        const v = getCookie(req, "anitrack_session");
        if (v && v.includes(".")) {
          const [sid] = v.split(".", 2);
          try {
            await env.AUTH_DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE id = ?`)
              .bind(nowSec(), sid).run();
          } catch {}
        }

        return json({ ok: true }, 200, { ...cors, "Set-Cookie": clearCookie("anitrack_session") });
      }

      return json({ ok: false, error: "not_found" }, 404, cors);

    } catch (e) {
      // Always return JSON (prevents HTML 1101 confusion)
      return json(
        { ok: false, error: "server_crash", detail: String(e?.stack || e?.message || e) },
        500,
        cors
      );
    }
  },
};
