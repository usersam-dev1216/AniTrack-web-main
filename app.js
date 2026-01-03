
'use strict';
/* ==========================================================================
   AniTrack — app.optimized.js
   A clean, de-duplicated, and fully wired version of your app.js
   - Fixes bugs (incl. stray dot in search), removes dupes, trims unused code
   - Matches your current index.html + style.css
   - Organized by feature blocks for quick maintenance
   ========================================================================== */

/* ----------------------------- DOM Shortcuts ------------------------------ */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------------------------- AniTrack API (MAL Middleman) ---------------------------- */
const MAL_API_BASE = 'https://anitrack-api.usersam1216.workers.dev'; // <-- your Worker URL

function malApiUrl(path) {
  return `${MAL_API_BASE}${path}`;
}

/* --- MAL score hydration for cards (fills missing scores; avoids "" -> 0.00) --- */
var __malScorePromises = new Map();
var __malScoreSaveTimer = null;

function __scheduleSaveToLocalStorage() {
  if (__malScoreSaveTimer) return;
  __malScoreSaveTimer = setTimeout(() => {
    __malScoreSaveTimer = null;
    try { saveToLocalStorage(); } catch (_) {}
  }, 800);
}

function __parseMalScore(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;           // <- stops "" from becoming 0
  const n = Number(s);
  return (Number.isFinite(n) && n > 0) ? n : null;
}

function __bestMalScoreFromAnime(anime) {
  return (
    __parseMalScore(anime?.malScore) ??
    __parseMalScore(anime?.malInfo?.mean) ??
    __parseMalScore(anime?.malInfo?.mean_score) ??
    __parseMalScore(anime?.malInfo?.score) ??
    __parseMalScore(anime?.malInfo?.node?.mean) ??
    __parseMalScore(anime?.malInfo?.node?.score) ??
    __parseMalScore(anime?.__malRaw?.mean) ??
    __parseMalScore(anime?.__malRaw?.mean_score) ??
    __parseMalScore(anime?.__malRaw?.score) ??
    __parseMalScore(anime?.mean) ??
    __parseMalScore(anime?.score) ??
    null
  );
}

function __ensureMalScoreForPill(anime, pillEl) {
  if (!anime || !pillEl) return;

  // If we already have a real score, render + normalize to anime.malScore
  const existing = __bestMalScoreFromAnime(anime);
  if (existing != null) {
    pillEl.textContent = existing.toFixed(2);
    if (__parseMalScore(anime.malScore) == null || Number(anime.malScore) !== existing) {
      anime.malScore = existing;
      __scheduleSaveToLocalStorage();
    }
    return;
  }

  // Otherwise fetch mean from MAL (via your worker), once per malId
  const malId = String(anime?.malId ?? anime?.mal_id ?? '').trim();
  if (!malId) {
    pillEl.textContent = 'N/A';
    return;
  }

  pillEl.textContent = '…'; // loading placeholder

  let p = __malScorePromises.get(malId);
  if (!p) {
    p = fetch(malApiUrl(`/api/anime/${encodeURIComponent(malId)}?fields=mean`))
      .then(r => (r.ok ? r.json() : null))
      .then(j => __parseMalScore(j?.data?.mean))
      .catch(() => null);
    __malScorePromises.set(malId, p);
  }

  p.then(n => {
    if (!pillEl.isConnected) return;
    pillEl.textContent = (n != null) ? n.toFixed(2) : 'N/A';
    if (n != null) {
      anime.malScore = n;
      __scheduleSaveToLocalStorage();
    }
  });
}

/* ---------------------------- DOM: Main Elements -------------------------- */
// Grid
const animeGrid = $('#animeGrid');

// Add/Edit modal
const addEditModal     = $('#addEditModal');
const animeForm        = $('#animeForm');
const addSeasonBtn     = $('#addSeasonBtn');
const seasonContainer  = $('#seasonContainer');
const fillByMalBtn     = $('#fillByMalBtn');
const uploadImageBtn   = $('#uploadImageBtn');
const urlImageBtn      = $('#urlImageBtn');
const imageUpload      = $('#imageUpload');
const urlInputGroup    = $('#urlInputGroup');
const imageUrl         = $('#imageUrl');
const imagePreview     = $('#imagePreview');

// Search + sort + status
const searchInput   = $('#searchInput');
const clearSearchBtn= $('#clearSearch');
const sortOption    = $('#sortOption');
const statusToggle  = $('#statusToggle');
const quickMalAddBtn = $('#quickMalAddBtn');

// List header view toggle (Card <-> List)
const viewModeBtn     = $('#viewModeBtn');

// List sidebar (list page only)
const listSidebar   = $('#listSidebar');
const lsAddBtn      = $('#lsAddBtn');
const lsBulkBtn     = $('#lsBulkBtn');
const lsViewBtn     = $('#lsViewBtn');
const lsStatsBtn    = $('#lsStatsBtn');
const lsSettingsBtn = $('#lsSettingsBtn');




const homeView         = $('#homeView');
const listView         = $('#listView');
const browseView        = $('#browseView');
const settingsView      = $('#settingsView');
const statisticsView    = $('#statisticsView');
const entryDetailsView  = $('#entryDetailsView');

// Auth + account/profile views
const accountView       = $('#accountView');
const profileView       = $('#profileView');


// NEW: Auth views
const userSignupView   = $('#usersignup');
const userLoginView    = $('#userlogin');



// Header nav buttons
const navHomeBtn     = $('#navHomeBtn');
const navBrowseBtn   = $('#navBrowseBtn');
const navListBtn     = $('#navListBtn');
const navStatsBtn    = $('#navStatsBtn');
const navSettingsBtn = $('#navSettingsBtn');
const navProfileBtn  = $('#navProfileBtn');

// Header profile meta (username + 2 links beside the icon)
const headerProfileTitle = $('#headerProfileTitle');
const headerProfileLink1 = $('#headerProfileLink1');
const headerProfileLink2 = $('#headerProfileLink2');


// Home rows
const homeTopAiringRow      = $('#homeTopAiringRow');
const homeFavoritesRow      = $('#homeFavoritesRow');
const homeRecentRow         = $('#homeRecentRow');
const homeTopYearRow        = $('#homeTopYearRow');
const homeTopLastSeasonRow  = $('#homeTopLastSeasonRow');

// Home spotlight (hero)
const homeSpotlight     = $('#homeSpotlight');
const spotlightTitleEl  = $('#spotlightTitle');
const spotlightMetaEl   = $('#spotlightMeta');
const spotlightDescEl   = $('#spotlightDesc');
const spotlightDetailBtn= $('#spotlightDetailBtn');
const spotlightNextBtn  = $('#spotlightNextBtn');
const spotlightPrevBtn  = $('#spotlightPrevBtn');

const spotlightCoverOverlay = $('#spotlightCoverOverlay');
const spotlightCoverImg     = $('#spotlightCoverImg');




// Detail modal
const detailModal        = $('#detailModal');
const detailHeader       = $('#detailHeader');
const detailModalContent = $('.detail-modal .modal-content');
const detailMenuBtn  = $('#detailMenuBtn'); // NEW
const editAnimeBtn   = $('#editAnimeBtn');
const rearrangeBtn   = $('#rearrangeBtn');
const favoriteBtn    = $('#favoriteBtn');
const deleteAnimeBtn = $('#deleteAnimeBtn');
const changeBgBtn    = $('#changeBgBtn');




// Single-season inputs
const malScoreInput     = $('#malScore');
const animeSeasonInput  = $('#animeSeason');
const animeEpisodesInput= $('#animeEpisodes');
const animeDurationInput= $('#animeDuration');
const animeRatingInput  = $('#animeRating');


const detailPrevBtn = document.getElementById('detailPrevBtn');
const detailNextBtn = document.getElementById('detailNextBtn');

detailPrevBtn?.addEventListener('click', () => showPreviousAnime());
detailNextBtn?.addEventListener('click', () => showNextAnime());



// Bulk edit
const newListFab        = $('#newListFab');
const bulkHeaderBtn     = $('#bulkHeaderBtn'); 
const bulkPanel         = $('#bulkPanel');
const bulkSelectAll     = $('#bulkSelectAll');
const bulkLinkRelations = $('#bulkLinkRelations'); 
const bulkFav           = $('#bulkFav');
const bulkDelete        = $('#bulkDelete');
const bulkApplyBtn      = $('#bulkApplyBtn');
const bulkCancelBtn     = $('#bulkCancelBtn');

// Import/Export
const importModal     = $('#importModal');
const importFile      = $('#importFile');
const importPreview   = $('#importPreview');
const processImportBtn= $('#processImportBtn');

// Stats modal
const ViewStats           = $('#ViewStats');
const modalTotalEntries   = $('#modalTotalEntries');
const modalTotalEpisodes  = $('#modalTotalEpisodes');
const modalAverageRating  = $('#modalAverageRating');
const modalAnimeDays      = $('#modalAnimeDays');
const modalElapsedDays    = $('#modalElapsedDays');
const startDateInput      = $('#startDateInput');
const endDateInput        = $('#endDateInput');
const prevYearBtn         = $('#prevYearBtn');
const nextYearBtn         = $('#nextYearBtn');
const savePeriodBtn       = $('#savePeriodBtn');
const statsModeLabelEl    = $('#statsModeLabel');
const statsModePrevBtn    = $('#statsModePrev');
const statsModeNextBtn    = $('#statsModeNext');

// Sidebar
const sidebar       = $('#sidebar');
const sidebarToggle = $('#sidebarToggle');
const closeSidebar  = $('#closeSidebar');
const sidebarInfo   = $('#sidebarInfo');
const sbInfoIcon    = $('#sbInfoIcon');
const sbInfoValue   = $('#sbInfoValue');
const sbInfoLabel   = $('#sbInfoLabel');

// Sidebar actions (main menu)
const homeFab       = $('#homeFab');
const browseFab     = $('#browseFab');
const listFab       = $('#listFab');
const statisticsFab = $('#statisticsFab');

const profileFab  = $('#profileFab');
const accountFab  = $('#accountFab');
const settingsFab = $('#settingsFab');

// Sidebar auth UI
const sbAuth      = $('#sbAuth');
const sbAuthGuest = $('#sbAuthGuest');
const sbAuthUser  = $('#sbAuthUser');
const sbUserName  = $('#sbUserName');
const sbUserEmail = $('#sbUserEmail');
const sbLogout    = $('#sbLogout');

const sbLogin  = $('#sbLogin');
const sbSignup = $('#sbSignup');

// Auth buttons + inline errors
const suSubmitBtn  = $('#suSubmitBtn');
const liSubmitBtn  = $('#liSubmitBtn');
const suErrorEl    = $('#suError');
const liErrorEl    = $('#liError');
const accLogoutBtn = $('#accLogoutBtn');

let __authUser = null;

function __safeJson(res) {
  return res.json().catch(() => ({}));
}

// -------------------- API (Unified Auth + List Worker) --------------------
// SINGLE worker handles BOTH auth + list via cookie session
const AUTH_API_BASE = 'https://anitrack-user-auth-list.usersam1216.workers.dev';
const LIST_API_BASE = 'https://anitrack-user-auth-list.usersam1216.workers.dev';

// Optional UI cache (can remove later if you truly want zero localStorage usage)
const AUTH_USER_KEY = 'AniTrack_AuthUserSnapshot';

// NOTE: Old JWT list-token flow removed. Everything uses credentials: "include".


function getCachedAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u || typeof u !== 'object') return null;
    if (!u.username && !u.email) return null;
    return u;
  } catch {
    return null;
  }
}

function setCachedAuthUser(u) {
  if (!u) { localStorage.removeItem(AUTH_USER_KEY); return; }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({
    id: u.id || '',
    username: u.username || '',
    email: u.email || '',
    emailVerified: !!u.emailVerified
  }));
}

function setAuthUser(u) {
  __authUser = u || null;
  setCachedAuthUser(__authUser);
  syncAuthUI();
}

function isUserLoggedIn() {
  return !!(__authUser || getCachedAuthUser());
}

function authUrl(path) {
  return `${AUTH_API_BASE}${path}`;
}

function authFetch(path, init = {}) {
  const headers = {
    ...(init.headers || {}),
  };

  // only set content-type if we actually send a body
  if (init.body && !headers['content-type'] && !headers['Content-Type']) {
    headers['content-type'] = 'application/json';
  }

  return fetch(`${AUTH_API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
}




function setAuthError(el, msg) {
  if (!el) return;
  el.textContent = msg || '';
  el.hidden = !msg;
}

function __usernameFromEmail(email) {
  const base = String(email || '').split('@')[0] || 'user';
  const cleaned = base.toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return ((cleaned || 'user') + '_' + suffix).slice(0, 24);
}

async function authSignup(email, username, password) {
  const res = await authFetch('/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, username, password })
  });
  const j = await __safeJson(res);
  return { res, j };
}

async function authLogin(identifier, password) {
  const res = await authFetch('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  });
  const j = await __safeJson(res);
  return { res, j };
}

async function authMe() {
  const res = await authFetch('/auth/me', { method: 'GET' });
  const j = await __safeJson(res);
  if (res.ok && j?.ok && j?.user) return j.user;
  return null;
}

async function authLogout() {
  try { await authFetch('/auth/logout', { method: 'POST' }); } catch {}
  setAuthUser(null);
}

function syncAccountFields() {
  const u = __authUser || getCachedAuthUser();
  const un = $('#accUsername');
  const em = $('#accEmail');
  if (un) un.value = u?.username || '';
  if (em) em.value = u?.email || '';
}

async function listFetch(path, init = {}) {
  const url = LIST_API_BASE + path;

  const headers = { ...(init.headers || {}) };
  if (init.body && !headers['content-type'] && !headers['Content-Type']) {
    headers['content-type'] = 'application/json';
  }

  return fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  });
}


// Loads MAL IDs from cloud and makes sure your local "animeList" contains those IDs.
// This does NOT change your UI design — it just ensures #list has the right items.
async function loadListFromCloudAndHydrate() {
  // only if logged in
  if (!isUserLoggedIn()) return;

  const res = await listFetch('/list', { method: 'GET' });
  const j = await __safeJson(res);

  if (!res.ok || !j?.ok) {
    throw new Error(j?.error || `list_fetch_failed_${res.status}`);
  }

  const items = Array.isArray(j.items) ? j.items : [];
  const ids = items
    .map(x => Number(x?.mal_id))
    .filter(n => Number.isFinite(n) && n > 0);

  // Merge into local list as placeholders.
  // Your existing MAL auto-sync can later enrich details.
  const existing = new Set((animeList || []).map(a => String(a?.id)));

  let added = 0;
  for (const malId of ids) {
    const key = `mal:${malId}`;
    if (existing.has(key)) continue;

    (animeList || (animeList = [])).push({
      id: key,
      malId,
      title: `MAL #${malId}`,
      subtitle: '',
      image: '',
      status: (items.find(i => Number(i?.mal_id) === malId)?.status) || 'Plan to Watch',
      relations: [],
      isFavorite: false
    });
    added++;
  }

  if (added) saveToLocalStorage();
}



function syncAuthUI() {
  const u = __authUser || getCachedAuthUser();
  const logged = !!u;

  // ----- Sidebar auth UI -----
  if (sbAuthGuest) sbAuthGuest.hidden = logged;
  if (sbAuthUser) sbAuthUser.hidden = !logged;

  if (logged) {
    if (sbUserName) sbUserName.textContent = u.username || '—';
    if (sbUserEmail) sbUserEmail.textContent = u.email || '';
  } else {
    if (sbUserName) sbUserName.textContent = '—';
    if (sbUserEmail) sbUserEmail.textContent = '';
  }

  // ----- Header profile UI (this was missing) -----
  if (headerProfileTitle) {
    headerProfileTitle.textContent = logged
      ? (u.username || u.email || 'User')
      : 'Welcome!';
  }

  if (headerProfileLink1) {
    headerProfileLink1.textContent = logged ? 'Profile' : 'Login';
    headerProfileLink1.setAttribute('href', logged ? '#profile' : '#userlogin');
  }

  if (headerProfileLink2) {
    headerProfileLink2.textContent = logged ? 'Account' : 'Sign up';
    headerProfileLink2.setAttribute('href', logged ? '#account' : '#usersignup');
  }

  syncAccountFields();
}

async function refreshAuthSession({ silent = false } = {}) {
  try {
    const u = await authMe();
    if (u) { setAuthUser(u); return true; }
    setAuthUser(null);
    return false;
  } catch {
    // likely CORS / cookies blocked; keep cached snapshot
    if (!silent) {
      showNotification?.('Auth check failed (CORS/cookies). Ensure Auth Worker ALLOWED_ORIGINS includes your GitHub Pages origin.');
    }
    syncAuthUI();
    return false;
  }
}

function initAuth() {
  // show cached instantly, then verify via /auth/me
  const cached = getCachedAuthUser();
  if (cached) __authUser = cached;
  syncAuthUI();
  refreshAuthSession({ silent: true });

  // Sidebar logout
  sbLogout?.addEventListener('click', async () => {
    await authLogout();
    closeSidebarFn?.();
    location.hash = '#home';
  });

  // Account sign out
  accLogoutBtn?.addEventListener('click', async () => {
    await authLogout();
    location.hash = '#home';
  });

  // SIGNUP
  const signupForm = userSignupView?.querySelector('form.auth-card');
  signupForm?.addEventListener('submit', (e) => { e.preventDefault(); suSubmitBtn?.click(); });

  suSubmitBtn?.addEventListener('click', async () => {
    setAuthError(suErrorEl, '');

    const email = String($('#suEmail')?.value || '').trim();
    let username = String($('#suUsername')?.value || '').trim();
    const password = String($('#suPassword')?.value ?? '');
    const password2 = String($('#suPassword2')?.value ?? '');

    if (!email || !email.includes('@')) return setAuthError(suErrorEl, 'Please enter a valid email.');
    if (password.length < 8) return setAuthError(suErrorEl, 'Password must be at least 8 characters.');
    if (password !== password2) return setAuthError(suErrorEl, 'Passwords do not match.');
    if (!username) username = __usernameFromEmail(email);

    suSubmitBtn.disabled = true;
    try {
      const { res, j } = await authSignup(email, username, password);
      if (!res.ok || !j?.ok) {
        return setAuthError(suErrorEl, `Signup failed: ${j?.error || 'signup_failed'}`);
      }

      // Auto-login (sets session cookie)
      const { res: lr, j: lj } = await authLogin(email, password);
      if (!lr.ok || !lj?.ok) {
        location.hash = '#userlogin';
        showNotification?.('Account created. Please log in.');
        return;
      }

      const ok = await refreshAuthSession({ silent: true });
      if (!ok) {
        return setAuthError(suErrorEl, 'Logged in, but cookie was not saved (browser may block third-party cookies).');
      }

      closeSidebarFn?.();
      location.hash = '#account';
      showNotification?.('Signed up & logged in.');
    } catch {
      setAuthError(suErrorEl, 'Signup failed (network/CORS). Check ALLOWED_ORIGINS on Auth Worker.');
    } finally {
      suSubmitBtn.disabled = false;
    }
  });

  // LOGIN
  const loginForm = userLoginView?.querySelector('form.auth-card');
  loginForm?.addEventListener('submit', (e) => { e.preventDefault(); liSubmitBtn?.click(); });

  liSubmitBtn?.addEventListener('click', async () => {
    setAuthError(liErrorEl, '');

    // worker expects "identifier" (email OR username)
    const identifier = String($('#liEmail')?.value || '').trim();
    const password = String($('#liPassword')?.value ?? '');

    if (!identifier || !password) return setAuthError(liErrorEl, 'Please enter your email/username and password.');

    liSubmitBtn.disabled = true;
    try {
      const { res, j } = await authLogin(identifier, password);
      if (!res.ok || !j?.ok) {
        return setAuthError(liErrorEl, `Login failed: ${j?.error || 'invalid_login'}`);
      }

      const ok = await refreshAuthSession({ silent: true });
      if (!ok) {
        return setAuthError(liErrorEl, 'Login worked, but cookie was not saved (browser may block third-party cookies).');
      }

      closeSidebarFn?.();
      location.hash = '#account';
      showNotification?.('Logged in.');
    } catch {
      setAuthError(liErrorEl, 'Login failed (network/CORS). Check ALLOWED_ORIGINS on Auth Worker.');
    } finally {
      liSubmitBtn.disabled = false;
    }
  });
}


// Settings modal
const settingsModal   = $('#settingsModal');
const settingsNav     = $('#settingsNav');
const settingsContent = $('#settingsContent');


// Detail drawer
const detailDrawerToggle = $('#detailDrawerToggle');
const detailActionDrawer = $('#detailActionDrawer');


// ===================== DefaultBackground (ONLY BG system) =====================
// All entries use ONLY their cover image as the background, blurred by DefaultBackground.blurPx.
// BGChange dock / custom BG / modes / drafts are removed.
const DefaultBackground = {
  enabled: true,
  blurPx: 18
};

// Works for Detail Modal OR EntryDetails page
function getBgSurface() {
  if (detailModal?.classList.contains('active') && detailModalContent) return detailModalContent;

  const page = document.getElementById('entryDetailsPage');
  if (page && !entryDetailsView?.hidden && String(location.hash || '').startsWith('#entrydetails')) return page;

  return detailModalContent || page || null;
}

function getEntryForBg(id) {
  return (animeList || []).find(x => String(x.id) === String(id)) || null;
}

// Keep the same function name so any existing calls still work.
function applyBgPreview() {
  const surface = getBgSurface();
  if (!surface) return;

  const entry = getEntryForBg(currentEditId);
  if (!entry) return;

  const cover = entry?.image ? String(entry.image) : '';
  const pos = entry.detailBackgroundPos || { x: 50, y: 50, scale: 1 };

  // Apply the cover as BG (no gradients/extra overlays here)
  window.applyDetailBackground?.(surface, cover, pos);

  // Tell CSS to blur the BG layer (our CSS will blur the BG itself, not backdrop-filter)
  if (cover && cover.trim()) {
    surface.setAttribute('data-bg-blur', '1');
    surface.style.setProperty('--default-bg-blur', `${DefaultBackground.blurPx}px`);
    surface.classList.add('has-bg');
  } else {
    surface.removeAttribute('data-bg-blur');
    surface.style.removeProperty('--default-bg-blur');
    surface.classList.remove('has-bg');
  }
}

// Kill BGChange button behavior if it exists in DOM
try {
  changeBgBtn?.removeEventListener?.('click', openBgDock);
  if (changeBgBtn) changeBgBtn.style.display = 'none';
} catch {}







// Period menu toggle (Days Elapsed → “…” menu)
const periodBtn  = document.querySelector('.period-options-btn');
const periodMenu = document.querySelector('.period-options-menu');

periodBtn?.addEventListener('click', (e) => {
  e.stopPropagation();                 // don’t bubble to document
  periodMenu?.classList.toggle('show');
});

// Click-away to close
document.addEventListener('click', (e) => {
  if (!e.target.closest('.period-options-menu') &&
      !e.target.closest('.period-options-btn')) {
    periodMenu?.classList.remove('show');
  }
});


// --- Add/Edit modal controls (icons + footer buttons) ---
addEditModal?.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  if (btn.id === 'uploadImageBtn') {        // Upload
    e.preventDefault();
    imageUpload?.click();
  }
  // inside addEditModal?.addEventListener('click', (e) => { ... })
if (btn.id === 'urlImageBtn') {           // URL Paste (direct from clipboard)
  e.preventDefault();
  (async () => {
    const clip = await tryReadClipboard();
    if (!clip) {
      alert('Could not read your clipboard (blocked/empty). Paste manually.');
      toggleUrlInput(); // graceful fallback to the manual URL field
      return;
    }
    const url = clip.trim();
    const tester = new Image();
    tester.onload = () => {
      currentImage = url;
      currentImageSource = 'manual';
      imagePreview.innerHTML = `<img src="${currentImage}" alt="Preview">`;
      showNotification?.('Poster set from clipboard URL');
    };
    tester.onerror = () => {
      alert('Invalid image link in your clipboard.');
      toggleUrlInput(); // let you paste/fix manually
    };
    tester.src = url;
  })();
}

  if (btn.id === 'fillByMalBtn') {          // MAL Fill
    e.preventDefault();
    handleFillByMAL();
  }
  if (btn.id === 'linkSequelBtn') {         // Link Preq/Seq
    e.preventDefault();
    (window.openLinkRelModal?.() ?? alert('Link Preq/Seq coming soon'));
  }
});

// file/url inputs
imageUpload?.addEventListener('change', handleImageUpload);
imageUrl?.addEventListener('change', handleImageUrl);

// SAVE (prevents page reload)
animeForm?.addEventListener('submit', saveAnime);


// Relations links inside DetailModal → open that entry
detailModal?.addEventListener('click', (e) => {
  const aTag = e.target.closest('a[data-open-relation]');
  if (!aTag) return;
  e.preventDefault();
  const targetId = aTag.dataset.openRelation;
  if (!targetId) return;
  openDetailModal(targetId);
});



/* ------------------------------- App State -------------------------------- */
let animeList = []; // hydrated list entries (UI continues to use this)
let currentEditId = null;
let currentImage  = null;

let currentFilteredList = [];
let currentIndex = -1;

let activeStatusFilter   = 'All';
let currentStatsYear     = new Date().getFullYear();
let trackingStartDate    = new Date('2023-01-01');
let trackingEndDate      = new Date();
let StatsMode            = 'Completed';
let currentImageSource = null; // 'manual' | 'mal' | null
let currentImageId = null;   // for IndexedDB handle
let currentImageUrl = null;  // for direct URL mode
let isBulkMode       = false;
const bulkSelected   = new Set();
let isRearrangeMode  = false;
let rearrangeCardId  = null;

let rearrangeNotification = null;
let sbInfoIndex = 0;
let sbInfoTimer = null;
let sidebarOverlay = null;

let __bgLockOpen = false; // background reposition lock for detail modal

let pendingMalId = null;  // set by MAL Fillup, persisted on Save

/* --------------------------- NEW: UserDatabase ---------------------------- */
/**
 * UserDatabase:
 * - keeps canonical entry data (library data)
 * UserAnimeList:
 * - keeps ONLY the user's list membership + user fields (status, seasons, fav, bg...)
 *
 * UI still uses `animeList`, but it is now a hydrated merge of:
 *   UserAnimeList (user fields) + UserDatabase.entries[key] (library fields)
 */
const LS_DB_KEY   = 'UserDatabase';
const LS_LIST_KEY = 'UserAnimeList';

let UserDatabase = {
  version: 1,
  updatedAt: 0,
  entries: {} // key -> canonical entry object
};

let UserAnimeList = []; // array of list-entry objects (minimal + user fields)

function makeEntryKey(entryOrMalId) {
  const malId = (typeof entryOrMalId === 'object' ? entryOrMalId?.malId : entryOrMalId);
  const mid = String(malId ?? '').trim();
  if (mid) return `mal:${mid}`;
  const id = (typeof entryOrMalId === 'object' ? entryOrMalId?.id : null);
  return `local:${String(id ?? Date.now() + Math.random())}`;
}

/**
 * Split a hydrated entry into:
 * - dbEntry: canonical/library fields (goes into UserDatabase)
 * - listEntry: user/list fields (goes into UserAnimeList)
 */
function splitHydratedEntry(a) {
  const key = makeEntryKey(a);

  // --- canonical / library fields (UserDatabase) ---
  const dbEntry = {
    key,
    malId: a?.malId != null ? String(a.malId) : '',
    title: a?.title ?? '',
    subtitle: a?.subtitle ?? '',
    genres: a?.genres ?? '',
    themes: a?.themes ?? '',
    synopsis: a?.synopsis ?? '',
    malScore: a?.malScore,
    malInfo: a?.malInfo ?? null,

    // cover image is still "entry data" (library)
    image: a?.image ?? null,
    imageSource: a?.imageSource
  };

  // --- user/list fields (UserAnimeList) ---
  const listEntry = {
    key,
    id: a?.id ?? (Date.now() + Math.random()),
    malId: a?.malId != null ? String(a.malId) : '',
    status: a?.status || 'Completed',
    seasons: Array.isArray(a?.seasons) ? a.seasons : [],
    isFavorite: !!a?.isFavorite,
    detailBackground: a?.detailBackground ?? null,
    detailBackgroundPos: a?.detailBackgroundPos ?? { x:50, y:50, scale:1 },

    // keep relations with the user's list entry (still user-level)
    linkRelations: a?.linkRelations ?? null
  };

  return { key, dbEntry, listEntry };
}

function hydrateAnimeListFromStores() {
  const db = UserDatabase?.entries || {};
  const list = Array.isArray(UserAnimeList) ? UserAnimeList : [];

  animeList = list.map(li => {
    const d = db[li.key] || {};
    const merged = { ...d, ...li };

    // normalize seasons (keep your existing duration compacting + epoch season fix)
    const seasons = Array.isArray(merged.seasons)
      ? merged.seasons.map(s => {
          const seasonTxt = (s && s.season != null) ? String(s.season).trim() : '';
          return {
            ...s,
            season: (/^winter\s+1970$/i.test(seasonTxt)) ? '' : s?.season,
            duration: (s && s.duration != null && String(s.duration).trim() !== '')
              ? compactDuration(s.duration)
              : s?.duration
          };
        })
      : merged.seasons;

    // normalize MAL score: allow numeric strings, but never treat "" as 0
    const _ms = merged?.malScore;
    const _n  = (_ms === null || _ms === undefined || String(_ms).trim() === '')
      ? NaN
      : Number(_ms);

    const malScoreNorm = (Number.isFinite(_n) && _n > 0) ? _n : null;

    return { ...merged, malScore: malScoreNorm, status: merged.status || 'Completed', seasons };
  });
}



/* -------------------------------- Constants ------------------------------- */
const STATS_MODES = ['All', 'Watching', 'Completed', 'On Hold', 'Plan to Watch', 'Dropped'];
const MS_PER_DAY  = 24 * 60 * 60 * 1000;
const SEASON_ORDER = { Winter: 1, Spring: 2, Summer: 3, Fall: 4 };




// Normalize empty values to "N/A"
const toNA = v => (v === null || v === undefined || String(v).trim() === '' ? 'N/A' : String(v).trim());
const numOrNA = v => {
  const s = String(v).trim();
  if (!s) return 'N/A';
  const n = Number(s);
  return Number.isFinite(n) ? n : 'N/A';
};


// The empty-state CTA gets wired inside render, but this is safe if you call it once too:
document.getElementById('addFirstAnimeBtn')?.addEventListener('click', openAddModal);


/* --------------------------------- Utils ---------------------------------- */
function prefersReduced() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function parseDuration(str) {
  if (!str) return 24;
  let mins = 0;
  const h = /(\d+)\s*h/i.exec(str);
  const m = /(\d+)\s*m/i.exec(str);
  if (h) mins += parseInt(h[1], 10) * 60;
  if (m) mins += parseInt(m[1], 10);
  return mins || 24;
}

// "23 m" -> "23m" | "1 h 23 m" -> "1h 23m"
function compactDuration(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  if (!/\d/.test(raw)) return raw;

  let s = raw
    .replace(/per\s*(?:ep(?:\.|isode)?|episode)/gi, '')
    .replace(/\bhrs?\b\.?/gi, 'h')
    .replace(/\bhr\b\.?/gi, 'h')
    .replace(/\bhours?\b/gi, 'h')
    .replace(/\bmins?\b\.?/gi, 'm')
    .replace(/\bmin\b\.?/gi, 'm')
    .replace(/\bminutes?\b/gi, 'm')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // remove gaps before units
  s = s.replace(/(\d+)\s*([hm])\b/g, '$1$2');

  // ensure space between hour block and minute block
  s = s.replace(/(\d+h)(?=\d+m\b)/g, '$1 ');

  return s.replace(/\s+/g, ' ').trim();
}



/* =======================
   LOCAL IMPORT (JSON / XML / TXT)
   ======================= */

/*
  IMPORTANT:
  You already have the real import system implemented below:
  - renderImportPreviewList(...)
  - handleFileImport(e)  -> builds the nice numbered preview list
  - processImport()      -> does the actual import
  This block must ONLY wire the UI events to those functions.
*/

importFile?.addEventListener('change', handleFileImport);
processImportBtn?.addEventListener('click', processImport);



function openSettings() {
  if (!settingsModal) return;

  // clear left-nav highlight
  settingsNav?.querySelectorAll('.settings-nav-item')
    .forEach(btn => btn.classList.remove('active'));

  // neutral empty state in the RIGHT pane
  if (settingsContent) {
    settingsContent.innerHTML = `<div class="settings-empty">Select a section to continue.</div>`;
  }

  settingsModal.classList.add('active');
}

function setSettingsSection(section) {
  // highlight the nav item
  if (settingsNav) {
    settingsNav.querySelectorAll('.settings-nav-item')
      .forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));
  }

  if (!settingsContent) return;

  const UD = `<div class="settings-empty"></div>`;
  const render = (inner = "") => {
    settingsContent.innerHTML = `
      <div class="settings-content">
        ${UD}
        ${inner}
      </div>`;
  };

  
if (section === 'personalization') {
  const col = UI.listColumns;
  const chk = (k, label) => `
    <label class="setting-check">
      <input type="checkbox" data-col="${k}" ${col[k] ? 'checked' : ''}/>
      <span>${label}</span>
    </label>`;

  const clampCPR = (n) => Math.max(6, Math.min(12, n));

  // normalize saved value (range 6–12)
  UI.cardsPerRow = clampCPR(parseInt(UI.cardsPerRow || 10, 10) || 10);
  saveUI();

  // Export-tab style layout (no subheadings; only 2 radio options)
  render(`
    <div class="setting-group export-format-group">
      <h3 class="stats-title">Select Your Preferred View</h3>

      <div class="export-format-row">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:18px; width:100%;">
          <label class="setting-check" style="margin:0;">
            <input type="radio" name="uiView" value="card" ${UI.viewMode==='card'?'checked':''}/>
            <span>Card Grid</span>
          </label>

          <!-- Arrow up/down stepper (6–12) -->
          <div id="uiCardsPerRowControl"
               title="Cards per row"
               style="display:inline-flex; align-items:center; gap:10px;">
            <span id="uiCardsPerRowValue"
                  style="min-width:26px; text-align:center; font-weight:700;">
              ${UI.cardsPerRow}
            </span>

            <div style="display:grid; grid-template-rows:1fr 1fr; gap:6px;">
              <button type="button"
                      class="icon-btn"
                      data-cpr-delta="1"
                      aria-label="Increase cards per row"
                      style="width:28px;height:18px;border-radius:10px;padding:0;line-height:1;">
                <i class="fas fa-chevron-up"></i>
              </button>
              <button type="button"
                      class="icon-btn"
                      data-cpr-delta="-1"
                      aria-label="Decrease cards per row"
                      style="width:28px;height:18px;border-radius:10px;padding:0;line-height:1;">
                <i class="fas fa-chevron-down"></i>
              </button>
            </div>
          </div>
        </div>

        <label class="setting-check" style="margin:0;">
          <input type="radio" name="uiView" value="list" ${UI.viewMode==='list'?'checked':''}/>
          <span>List Grid</span>
        </label>
      </div>

      <!-- Keep existing checkbox designs; disable/grey when Card Grid is selected -->
      <div id="uiListColumnsWrap" class="check-grid three-col" style="margin-top:8px;">
        ${chk('type','Type')}
        ${chk('season','Season')}
        ${chk('status','Status')}
        ${chk('genres','Genres')}
        ${chk('themes','Themes')}
        ${chk('episodes','Episodes')}
        ${chk('duration','Duration')}
        ${chk('malScore','MAL score')}
        ${chk('rating','Rating')}
      </div>
    </div>
  `);

  const syncState = () => {
    const isList = UI.viewMode === 'list';

    const wrap = settingsContent.querySelector('#uiListColumnsWrap');
    const cprWrap = settingsContent.querySelector('#uiCardsPerRowControl');

    // show stepper only for Card Grid
    if (cprWrap) cprWrap.style.display = isList ? 'none' : 'inline-flex';

    // disable/grey list-grid column toggles unless List Grid is selected
    if (wrap) {
      wrap.style.opacity = isList ? '1' : '0.45';
      wrap.style.pointerEvents = isList ? 'auto' : 'none';
      wrap.querySelectorAll('input[type="checkbox"][data-col]').forEach(inp => {
        inp.disabled = !isList;
      });
    }
  };

  // wiring: view mode
  settingsContent.querySelectorAll('input[name="uiView"]').forEach(r => {
    r.addEventListener('change', (e) => {
      UI.viewMode = e.target.value === 'list' ? 'list' : 'card';
      saveUI();
      syncState();
      renderAnimeCards();
      window.dispatchEvent(new Event('resize')); // apply columns immediately
    });
  });

  // wiring: cards-per-row stepper
  const cprValue = settingsContent.querySelector('#uiCardsPerRowValue');
  settingsContent.querySelectorAll('[data-cpr-delta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = parseInt(btn.getAttribute('data-cpr-delta'), 10) || 0;
      UI.cardsPerRow = clampCPR((parseInt(UI.cardsPerRow || 10, 10) || 10) + delta);
      saveUI();
      if (cprValue) cprValue.textContent = String(UI.cardsPerRow);
      window.dispatchEvent(new Event('resize')); // apply columns immediately
    });
  });

  // wiring: list columns
  settingsContent.querySelectorAll('input[type="checkbox"][data-col]').forEach(c => {
    c.addEventListener('change', (e) => {
      const key = e.target.getAttribute('data-col');
      if (key === 'title') { e.target.checked = true; return; } // kept for future-proofing
      UI.listColumns[key] = !!e.target.checked;
      saveUI();
      renderAnimeCards();
    });
  });

  syncState();
  return;
}


// Settings: IMPORT (MAL XML.GZ upload → extract MAL IDs → import+sync)
if (section === 'import') {
  render(`
    <form id="malImportForm" class="mal-import">
      <div class="setting-group">
        <label class="setting-label" for="malExportGz">MyAnimeList export (XML.GZ)</label>
        <div class="mal-username-row">
          <i class="fas fa-file-archive"></i>
          <input id="malExportGz" class="form-control" type="file" accept=".xml.gz,.gz,.xml" />
        </div>
        <div class="muted" style="margin-top:6px;font-size:12px;">
          Upload your MAL <b>animelist export</b> (.xml.gz). AniTrack will extract MAL IDs and import them.
        </div>
      </div>

      <div class="setting-group">
        <div class="erase-row">
          <div>
            <div class="erase-title">Erase</div>
            <div class="erase-hint">Delete all anime in your list before processing the import, otherwise this will merge to your existing list.</div>
          </div>
          <label class="switch">
            <input id="malErase" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-group">
        <div class="stats-title">Stats</div>
        <div class="stats-grid-2col">
          ${[
            ['Watching','watching'],
            ['Plan to Watch','plan_to_watch'],
            ['Completed','completed'],
            ['Dropped','dropped'],
            ['On-Hold','on_hold']
          ].map(([label,val]) => `
            <label class="setting-check">
              <input type="checkbox" name="malStatus" value="${val}" checked />
              <span>${label}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="btn-row">
        <button id="malImportBtn" class="btn btn-danger" type="submit">
          <i class="fas fa-file-import"></i> Import
        </button>
        <button id="fallbackJsonBtn" class="btn btn-outline" type="button">
          Import from AniTrack Export
        </button>
      </div>

      <div id="malImportLog" class="mal-log"></div>

      <div style="margin-top:10px;">
        <progress id="malImportProgress" max="100" value="0" style="width:100%; height:14px;"></progress>
        <div id="malImportProgressLabel" class="muted" style="margin-top:6px; font-size:12px;"></div>
      </div>

      <div id="malImportResumeWrap" style="margin-top:10px; display:none; gap:10px; flex-wrap:wrap;">
        <button id="malImportResumeBtn" class="btn btn-outline" type="button">
          <i class="fas fa-play"></i> Resume last import
        </button>
        <button id="malImportClearStateBtn" class="btn btn-outline" type="button" title="Clears the saved import progress">
          <i class="fas fa-eraser"></i> Clear progress
        </button>
      </div>
    </form>
  `);

  document.getElementById('fallbackJsonBtn')?.addEventListener('click', () => {
    closeWithAnimation(settingsModal);
    importModal?.classList.add('active');
  });

  const logEl   = document.getElementById('malImportLog');
  const progEl  = document.getElementById('malImportProgress');
  const progLbl = document.getElementById('malImportProgressLabel');
  const btnImp  = document.getElementById('malImportBtn');
  const eraseEl = document.getElementById('malErase');

  const fileEl  = document.getElementById('malExportGz');

  const resumeWrap = document.getElementById('malImportResumeWrap');
  const resumeBtn  = document.getElementById('malImportResumeBtn');
  const clearBtn   = document.getElementById('malImportClearStateBtn');

  const paint = (payload) => {
    if (typeof payload === 'string') {
      if (logEl) logEl.textContent = payload;
      return;
    }
    const text = payload?.text ?? '';
    const pct  = payload?.pct;

    if (logEl && text) logEl.textContent = text;

    if (progEl) {
      const v = Number(pct);
      if (Number.isFinite(v)) progEl.value = Math.max(0, Math.min(100, v));
      else progEl.removeAttribute('value'); // indeterminate
    }
    if (progLbl) progLbl.textContent = payload?.label || '';
  };

  const syncResumeUI = () => {
    const st = loadMALImportState?.();
    const has = !!st && st.phase !== 'done';
    if (resumeWrap) resumeWrap.style.display = has ? 'flex' : 'none';

    if (has) {
      paint({
        text: st.lastMsg || 'Unfinished MAL import found.',
        pct: Number.isFinite(+st.pct) ? +st.pct : undefined,
        label: st.lastLabel || ''
      });
    }
  };

  clearBtn?.addEventListener('click', () => {
    if (!confirm('Clear saved MAL import progress?')) return;
    clearMALImportState?.();
    if (logEl) logEl.textContent = '';
    if (progLbl) progLbl.textContent = '';
    if (progEl) { progEl.value = 0; progEl.max = 100; }
    syncResumeUI();
  });

  const runImport = async ({ resume = false } = {}) => {
    const erase    = !!eraseEl?.checked;
    const statuses = Array.from(document.querySelectorAll('input[name="malStatus"]:checked')).map(i => i.value);

    if (!resume) {
      const f = fileEl?.files?.[0];
      if (!f) { alert('Upload your MAL export (.xml.gz) first.'); return; }
      if (statuses.length === 0) { alert('Pick at least one status.'); return; }
    }

    btnImp && (btnImp.disabled = true);
    resumeBtn && (resumeBtn.disabled = true);

    try {
      paint({ text: 'Starting MAL XML.GZ import…', pct: 0, label: '' });

      const added = await importFromMALExportGZ({
        file: fileEl?.files?.[0],
        statuses,
        erase,
        onProgress: paint,
        resume
      });

      paint({ text: `Imported ${added} entr${added === 1 ? 'y' : 'ies'}.`, pct: 100, label: 'Done' });
      showNotification?.('MAL import complete');
      renderAnimeCards();
      refreshSidebarInfo?.();
    } catch (err) {
      console.error(err);
      paint({ text: err?.message || 'Import failed.', pct: undefined, label: '' });
      syncResumeUI();
    } finally {
      btnImp && (btnImp.disabled = false);
      resumeBtn && (resumeBtn.disabled = false);
      syncResumeUI();
    }
  };

  document.getElementById('malImportForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    runImport({ resume: false });
  });

  resumeBtn?.addEventListener('click', () => runImport({ resume: true }));

  syncResumeUI();
  return;
}



    if (section === 'export') {
    render(`
      <div class="setting-group export-format-group">
        <div class="stats-title">Select Your Preferred Export Format</div>

        <div class="export-format-row">
          <label class="setting-check export-format-item">
            <input type="radio" name="exportFormat" value="json" checked>
            <div class="export-format-copy">
              <div class="export-format-heading"><b>JSON</b></div>
              <div class="export-format-sub muted">
                Export your list in JSON format. Keeps every detail and can be imported back into AniTrack at any time.
              </div>
            </div>
          </label>

          <label class="setting-check export-format-item">
            <input type="radio" name="exportFormat" value="xml">
            <div class="export-format-copy">
              <div class="export-format-heading"><b>XML</b></div>
              <div class="export-format-sub muted">
                Export your list in XML format. Useful for advanced backups or using your data with other apps and tools.
              </div>
            </div>
          </label>

          <label class="setting-check export-format-item">
            <input type="radio" name="exportFormat" value="txt">
            <div class="export-format-copy">
              <div class="export-format-heading"><b>TXT</b></div>
              <div class="export-format-sub muted">
                Export your list as a clean text document for quick reading, sharing, or printing.
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- keep the export button in the same absolute-bottom-right spot -->
      <button class="btn settings-cta" id="settingsExportBtn">
        <i class="fas fa-file-export"></i> Export
      </button>
    `);

    document.getElementById('settingsExportBtn')?.addEventListener('click', () => {
      const selected = settingsContent.querySelector('input[name="exportFormat"]:checked');
      const format   = selected?.value || 'json';
      closeWithAnimation(settingsModal);
      exportData(format); // now takes a format
    });
    return;
  }



  if (section === 'reset') {
    render(`<button class="btn settings-cta btn-danger" id="settingsResetBtn">
              <i class="fas fa-trash"></i> Reset
            </button>`);
    document.getElementById('settingsResetBtn')?.addEventListener('click', () => {
      closeWithAnimation(settingsModal);
      resetData(); // existing reset (with confirm)
    });
    return;
  }
}


// --- MAL Import (via MAL XML.GZ export) — resumable + progress ---
// Stores progress so the import can resume after refresh/crash
const MAL_IMPORT_STATE_KEY = 'aniTrack.malImportState';

function loadMALImportState() {
  try { return JSON.parse(localStorage.getItem(MAL_IMPORT_STATE_KEY) || 'null'); }
  catch { return null; }
}
function saveMALImportState(state) {
  try { localStorage.setItem(MAL_IMPORT_STATE_KEY, JSON.stringify(state)); } catch {}
}
function clearMALImportState() {
  try { localStorage.removeItem(MAL_IMPORT_STATE_KEY); } catch {}
}

// Map MAL export my_status (numbers) to your UI labels
// MAL XML usually uses:
// 1=Watching, 2=Completed, 3=On-Hold, 4=Dropped, 6=Plan to Watch
const MAL_STATUS_NUM_TO_LABEL = {
  1: 'Watching',
  2: 'Completed',
  3: 'On Hold',
  4: 'Dropped',
  6: 'Plan to Watch'
};

// Your settings UI uses these values:
const SETTINGS_STATUS_TO_LABEL = {
  watching: 'Watching',
  completed: 'Completed',
  on_hold: 'On Hold',
  dropped: 'Dropped',
  plan_to_watch: 'Plan to Watch'
};

function _normId(v) { return (v == null || v === '') ? '' : String(v); }

async function readTextFromMaybeGzipFile(file) {
  if (!file) throw new Error('Missing file');
  const name = String(file.name || '').toLowerCase();

  // If user accidentally uploads .xml (not gz), just read as text
  if (name.endsWith('.xml')) {
    return await file.text();
  }

  // For .gz / .xml.gz → try browser-native gzip decompression
  // (works in Chromium-based + modern Firefox; if unsupported, you’ll need pako)
  const ab = await file.arrayBuffer();

  if (typeof DecompressionStream === 'function') {
    const ds = new DecompressionStream('gzip');
    const decompressedStream = new Blob([ab]).stream().pipeThrough(ds);
    const decompressedBlob = await new Response(decompressedStream).blob();
    return await decompressedBlob.text();
  }

  throw new Error(
    'Your browser does not support gzip decompression (DecompressionStream). ' +
    'Either upload the plain .xml export, or add a gzip library like pako.'
  );
}

function parseMALExportXML(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(String(xmlText || ''), 'application/xml');
  if (xml.querySelector('parsererror')) throw new Error('Invalid MAL XML');

  // MAL export structure: <myanimelist><anime>...</anime></myanimelist>
  const animeNodes = Array.from(xml.querySelectorAll('myanimelist > anime, anime'));
  const entries = animeNodes.map(node => {
    const get = (tag) => node.querySelector(tag)?.textContent?.trim() || '';
    const malId = get('series_animedb_id') || get('series_mal_id') || get('mal_id') || '';
    const title = get('series_title') || '';
    const statusNum = parseInt(get('my_status') || '0', 10) || 0;
    return { malId, title, statusNum };
  }).filter(x => x.malId);

  return entries;
}

function entryExistsByMalId(malId) {
  const mid = _normId(malId);
  return (animeList || []).some(a => _normId(a?.malId) === mid);
}

function makeSkeletonEntry({ malId, statusLabel }) {
  return {
    id: Date.now() + Math.random(),
    title: 'Loading…',
    subtitle: 'TV',
    genres: '',
    themes: '',
    image: null,
    imageSource: undefined,
    status: statusLabel || 'Completed',
    seasons: [{ title: '', format: 'TV', season: '', episodes: 0, duration: '24m', rating: '' }],
    malScore: undefined,
    malId: String(malId),
    isFavorite: false,
    detailBackground: null,
    detailBackgroundPos: { x:50, y:50, scale:1 }
  };
}

async function importFromMALExportGZ({ file, statuses, erase, onProgress = ()=>{}, resume = false }) {
  // erase = fresh start (also clears any old saved import progress)
  if (erase) {
    animeList = [];
    saveToLocalStorage();
    clearMALImportState();
  }

  const allowedLabels = (Array.isArray(statuses) ? statuses : [])
    .map(s => SETTINGS_STATUS_TO_LABEL[s])
    .filter(Boolean);

  if (!allowedLabels.length) throw new Error('No statuses selected');

  let state = loadMALImportState();

  // If not resuming, parse file and create a new state
  if (!resume || !state || state.phase === 'done') {
    if (!file) throw new Error('Missing MAL export file');

    onProgress({ text: 'Reading export…', pct: 0, label: '' });
    const xmlText = await readTextFromMaybeGzipFile(file);

    onProgress({ text: 'Parsing export…', pct: 2, label: '' });
    const parsed = parseMALExportXML(xmlText);

        // Filter to selected statuses (but FALL BACK if MAL status is missing/unexpected)
    const filtered = parsed.filter(x => {
      const lbl = MAL_STATUS_NUM_TO_LABEL[x.statusNum] || '';
      return allowedLabels.includes(lbl);
    });

    // If nothing matched but we did parse entries, MAL export status tags are likely different/empty.
    // Fallback: import everything that has a malId (still respects duplicate-check later).
    const pick = (filtered.length > 0) ? filtered : parsed;

    // Helpful log so we can diagnose future cases quickly
    onProgress({
      text: `Parsed ${parsed.length} entries from MAL export. Matched statuses: ${filtered.length}. Importing: ${pick.length}.`,
      pct: 3,
      label: ''
    });

    state = {
      phase: 'running',
      idx: 0,
      total: pick.length,
      ids: pick.map(x => ({
        malId: String(x.malId),
        status: (MAL_STATUS_NUM_TO_LABEL[x.statusNum] || 'Completed')
      })),
      added: 0,
      pct: 0,
      lastMsg: '',
      lastLabel: ''
    };

    saveMALImportState(state);
  }

  if (!state?.ids?.length) {
    state.phase = 'done';
    state.pct = 100;
    state.lastMsg = 'Nothing to import for the selected statuses.';
    state.lastLabel = 'Done';
    saveMALImportState(state);
    clearMALImportState();
    return 0;
  }

  // Main loop: create entry → fetch full by malId → applyMALDiff → save
  for (; state.idx < state.ids.length; state.idx++) {
    const { malId, status } = state.ids[state.idx];

    state.pct = Math.round((state.idx / Math.max(1, state.ids.length)) * 100);
    state.lastLabel = `Importing ${state.idx + 1}/${state.ids.length}`;
    state.lastMsg = `Processing MAL ID ${malId}… (added ${state.added})`;
    saveMALImportState(state);
    onProgress({ text: state.lastMsg, pct: state.pct, label: state.lastLabel });

    if (entryExistsByMalId(malId)) continue;

    // 1) add skeleton (so you see something happening even if fetch is slow)
    const entry = makeSkeletonEntry({ malId, statusLabel: status });
    animeList.unshift(entry);
    saveToLocalStorage();

    // 2) fetch details (uses your existing Jikan-by-ID function + mapping)
    //    (You said “same mapping as quick add” — that mapping is effectively: MAL ID → fetch → applyMALDiff)
    try {
      const item = await jikanFetchFullById(malId);
      if (item) {
        applyMALDiff(entry, item);
      }
      // always persist after each entry so it’s crash-safe
      saveToLocalStorage();
      state.added++;
    } catch (err) {
      // Keep the skeleton entry (still has malId) so future auto-sync can fill it
      console.error('Import item failed', malId, err);
      saveToLocalStorage();
    }

    // Gentle delay to reduce rate limiting
    await delay(900);
  }

  state.phase = 'done';
  state.pct = 100;
  state.lastMsg = `Imported ${state.added} entries.`;
  state.lastLabel = 'Done';
  saveMALImportState(state);

  // clear after success
  clearMALImportState();

  return state.added || 0;
}

function delay(ms){ return new Promise(r => setTimeout(r, ms)); }

function delay(ms){ return new Promise(r => setTimeout(r, ms)); }

function guessSeasonFromDate(dLike){
  try{
    // Prevent "Winter 1970" from null/epoch placeholders
    if (dLike == null) return null;
    if (typeof dLike === 'number' && dLike === 0) return null;

    if (typeof dLike === 'string') {
      const t = dLike.trim();
      if (!t) return null;
      if (/^1970-01-01(?:T|$)/.test(t)) return null; // common placeholder
    }

    let d;
    if (typeof dLike === 'object') {
      const y = Number(dLike.year);
      if (!Number.isFinite(y) || y <= 0) return null;
      const mo = Number(dLike.month);
      const month = (Number.isFinite(mo) && mo >= 1 && mo <= 12) ? mo : 1;
      d = new Date(y, month - 1, 1);
    } else {
      d = new Date(dLike);
    }

    if (!Number.isFinite(d.getTime())) return null;

    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const season = (m<=3?'Winter':m<=6?'Spring':m<=9?'Summer':'Fall');
    return `${season} ${y}`;
  }catch{ return null; }
}






function seasonKey(text = '') {
  const m = String(text).match(/\b(Winter|Spring|Summer|Fall)\s+((?:19|20)\d{2})\b/i);
  if (!m) return { y: -Infinity, o: -Infinity };
  const name = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
  const year = parseInt(m[2], 10);
  const ord  = SEASON_ORDER[name] || 0;
  return { y: year, o: ord };
}

// --- NEW: infer "Winter/Spring/Summer/Fall YYYY" from MAL data ---
function inferPremieredTimelineFromMAL(d){
  // Prefer MAL start_season if available
  const ss = d?.start_season;
  const yr = (typeof ss?.year === 'number') ? ss.year : null;
  const s  = String(ss?.season || '').toLowerCase();

  if (yr && s) {
    const map = { winter:'Winter', spring:'Spring', summer:'Summer', fall:'Fall', autumn:'Fall' };
    const name = map[s] || (s ? (s[0].toUpperCase() + s.slice(1)) : '');
    if (name) return `${name} ${yr}`;
  }

  // Fallback to start_date month -> season
  const start = String(d?.start_date || d?.aired?.from || '').slice(0,10);
  const m = start.match(/^(\d{4})-(\d{2})-/);
  if (!m) return '';

  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);

  let season = '';
  if (month >= 1 && month <= 3) season = 'Winter';
  else if (month >= 4 && month <= 6) season = 'Spring';
  else if (month >= 7 && month <= 9) season = 'Summer';
  else if (month >= 10 && month <= 12) season = 'Fall';

  return season ? `${season} ${year}` : '';
}

// --- NEW: "24 min" from seconds (MAL avg episode duration is seconds) ---
function formatDurationSeconds(sec){
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return '';

  const mins = Math.round(n / 60);
  if (mins <= 0) return '';

  // 23m
  if (mins < 60) return `${mins}m`;

  // 2h 10m (or 2h)
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// --- NEW: neat status text ---
function prettyAiringStatus(raw){
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  const map = {
  currently_airing: 'Currently Airing',
  finished_airing: 'Finished Airing',
  not_yet_aired: 'Not Yet Aired',
  not_aired_yet: 'Not Yet Aired'
};

  if (map[s]) return map[s];

  // generic snake_case -> Title case
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}


function startOfLocalDay(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function elapsedDays(start, end) {
  return Math.ceil((startOfLocalDay(end) - startOfLocalDay(start)) / MS_PER_DAY);
}

function createNotificationElement() {
  if (rearrangeNotification) return;
  rearrangeNotification = document.createElement('div');
  rearrangeNotification.className = 'notification';
  document.body.appendChild(rearrangeNotification);
}
function showNotification(message, duration = 3000) {
  createNotificationElement();
  rearrangeNotification.textContent = message;
  rearrangeNotification.classList.add('show');
  setTimeout(() => rearrangeNotification.classList.remove('show'), duration);
}

function updateDetailNavButtons() {
  const prev = document.getElementById('detailPrevBtn');
  const next = document.getElementById('detailNextBtn');
  if (!prev || !next) return;

  const atStart = currentIndex <= 0;
  const atEnd   = currentIndex >= (currentFilteredList.length - 1);

  prev.disabled = atStart;
  next.disabled = atEnd;
  prev.classList.toggle('disabled', atStart);
  next.classList.toggle('disabled', atEnd);
}

function navigateDetail(direction) {
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= currentFilteredList.length) return;
  const nextId = currentFilteredList[nextIndex].id;
  swapToAnime(nextId, direction);
  updateDetailNavButtons(); // keep buttons in sync
}


/* ------------------------------- Storage ---------------------------------- */

// NOTE: Link Relations can "disappear" after refresh if IDs get normalized (dup/null IDs).
// This version remaps IDs AND repairs relations/groups so they always resolve.

const _idStr = (v) => (v == null ? '' : String(v));

function normalizeIds() {
  const seen = new Set();
  let next = 1;

  // oldId(string) -> newId(string)
  const remap = new Map();

  (animeList || []).forEach(a => {
    if (!a) return;

    const oldId = _idStr(a.id);
    let id = a.id;

    if (id == null || seen.has(_idStr(id))) {
      while (seen.has(String(next))) next++;
      id = next;
    }

    a.id = id;
    const newId = _idStr(id);

    if (oldId && oldId !== newId) remap.set(oldId, newId);
    seen.add(newId);
  });

  // Update any relations that referenced changed IDs
  if (remap.size) {
    const mapArr = (arr) =>
      (Array.isArray(arr) ? arr : [])
        .map(x => remap.get(_idStr(x)) || _idStr(x))
        .filter(Boolean);

    (animeList || []).forEach(a => {
      const lr = a?.linkRelations;
      if (!lr) return;

      if (Array.isArray(lr.linkedIds)) lr.linkedIds = mapArr(lr.linkedIds);

      if (Array.isArray(lr.groups)) {
        lr.groups = lr.groups.map(g => ({
          ...g,
          linkedIds: mapArr(g?.linkedIds)
        }));
      }
    });
  }
}

function repairLinkRelations() {
  const list = Array.isArray(animeList) ? animeList : [];
  const byId = new Map(list.map(a => [_idStr(a?.id), a]).filter(([k,v]) => k && v));
  const idSet = new Set(byId.keys());

  // 1) Sanitize shapes + collect group membership
  const groupMembers = new Map(); // groupId -> Set(memberIds)

  for (const a of list) {
    if (!a) continue;

    const self = _idStr(a.id);
    const lr = a.linkRelations;

    if (!lr) continue;

    // Normalize: ensure lr.groups is an array (if legacy linkedIds exists, keep it, but groups drive "firm" repair)
    let groups = Array.isArray(lr.groups) ? lr.groups.slice() : [];

    // If someone somehow stored a legacy single-group object
    if (!groups.length && lr.groupId && Array.isArray(lr.linkedIds)) {
      groups = [{
        groupId: String(lr.groupId),
        linkedIds: lr.linkedIds.slice(),
        updatedAt: lr.updatedAt || Date.now()
      }];
    }

    // Sanitize groups
    groups = groups
      .map(g => ({
        groupId: g?.groupId ? String(g.groupId) : '',
        updatedAt: g?.updatedAt || Date.now(),
        linkedIds: (Array.isArray(g?.linkedIds) ? g.linkedIds : [])
          .map(_idStr)
          .filter(x => x && x !== self && idSet.has(x))
      }))
      .filter(g => g.groupId && g.linkedIds.length);

    // Track group membership (members = self + linkedIds)
    for (const g of groups) {
      if (!groupMembers.has(g.groupId)) groupMembers.set(g.groupId, new Set());
      const set = groupMembers.get(g.groupId);
      set.add(self);
      g.linkedIds.forEach(x => set.add(x));
    }

    // Flatten union (even if groups empty, keep legacy linkedIds sanitized so UI won't break)
    const legacy = Array.isArray(lr.linkedIds) ? lr.linkedIds : [];
    const flat = [
      ...groups.flatMap(g => g.linkedIds),
      ...legacy.map(_idStr)
    ].filter(x => x && x !== self && idSet.has(x));

    const union = [...new Set(flat)];

    a.linkRelations = {
      ...lr,
      groups,
      linkedIds: union,
      updatedAt: lr.updatedAt || Date.now()
    };

    // If everything became empty after sanitizing, remove it entirely (keeps Relations tab hidden)
    const hasAny = (a.linkRelations.groups?.length || 0) > 0 || (a.linkRelations.linkedIds?.length || 0) > 0;
    if (!hasAny) delete a.linkRelations;
  }

  // 2) Firm repair: for each groupId, enforce the same membership across all members
  for (const [groupId, membersSet] of groupMembers.entries()) {
    const members = [...membersSet].filter(idSet.has.bind(idSet));
    if (members.length < 2) continue;

    for (const memberId of members) {
      const entry = byId.get(memberId);
      if (!entry) continue;

      const lr = entry.linkRelations || {};
      let groups = Array.isArray(lr.groups) ? lr.groups.slice() : [];

      // remove any broken/partial version of this groupId
      groups = groups.filter(g => String(g?.groupId || '') !== groupId);

      groups.push({
        groupId,
        linkedIds: members.filter(x => x !== memberId),
        updatedAt: Date.now()
      });

      const union = [...new Set(groups.flatMap(g => g.linkedIds).map(_idStr).filter(Boolean))];

      entry.linkRelations = {
        ...lr,
        groups,
        linkedIds: union,
        updatedAt: Date.now()
      };
    }
  }
}

function loadFromLocalStorage() {
  // Only keep small UI-only values locally (tracking dates).
  try {
    const s = localStorage.getItem('trackingStartDate');
    const e = localStorage.getItem('trackingEndDate');
    if (s) trackingStartDate = new Date(s);
    if (e) trackingEndDate = new Date(e);
  } catch {}

  // D1 is the source of truth for the list now.
  // Keep stores in-memory only (empty until cloud hydrate runs).
  UserDatabase = { version: 1, updatedAt: Date.now(), entries: {} };
  UserAnimeList = [];
  animeList = animeList || [];

  // Keep your existing repair steps safe (they’ll run on whatever is loaded later).
  normalizeIds?.();
  repairLinkRelations?.();
}

function saveToLocalStorage() {
  // NO LIST PERSISTENCE TO LOCALSTORAGE ANYMORE.
  // Keep tracking dates only (tiny + harmless).
  try {
    localStorage.setItem('trackingStartDate', trackingStartDate.toISOString());
    localStorage.setItem('trackingEndDate', trackingEndDate.toISOString());
  } catch {}

  // Keep cloud in sync (debounced) if available
  try { syncListToCloudDebounced?.(); } catch (_) {}
}



/* ----------------------- CLOUD LIST (D1 via unified worker) ----------------------- */

function __getMalIdFromEntry(entry) {
  const v =
    entry?.malId ??
    entry?.mal_id ??
    entry?.mal ??
    entry?.malInfo?.mal_id ??
    entry?.malInfo?.node?.id ??
    entry?.__malRaw?.mal_id ??
    null;

  const n = Number(v);
  return (Number.isFinite(n) && n > 0) ? n : null;
}

let __cloudSyncTimer = null;
function syncListToCloudDebounced() {
  if (!isUserLoggedIn()) return;

  clearTimeout(__cloudSyncTimer);
  __cloudSyncTimer = setTimeout(async () => {
    try {
      // desired from UI memory
      const desired = new Map(); // malId -> status
      for (const a of (animeList || [])) {
        const malId = __getMalIdFromEntry(a);
        if (!malId) continue;
        desired.set(malId, a?.status || 'Plan to Watch');
      }

      // current from cloud
      const res = await listFetch('/list', { method: 'GET' });
      const j = await __safeJson(res);
      if (!res.ok || !j?.ok) throw new Error(j?.error || `list_fetch_failed_${res.status}`);

      const currentItems = Array.isArray(j.items) ? j.items : [];
      const currentIds = new Set(
        currentItems.map(it => Number(it?.mal_id)).filter(n => Number.isFinite(n) && n > 0)
      );

      // delete items that exist in cloud but not locally
      for (const mid of currentIds) {
        if (!desired.has(mid)) {
          await listFetch(`/list/${mid}`, { method: 'DELETE' });
        }
      }

      // upsert everything desired
      for (const [mid, status] of desired.entries()) {
        await listFetch('/list/upsert', {
          method: 'POST',
          body: JSON.stringify({ malId: mid, status }),
        });
      }
    } catch (e) {
      console.warn('Cloud list sync failed:', e);
    }
  }, 600);
}







// Called when user opens #list
async function loadListFromCloudAndHydrate() {
  if (!__authUser) return;

  try {
    const ids = await cloudListGetIds();

    // If you already have some local list, keep it, but ensure cloud entries exist locally.
    // We hydrate missing items by opening EntryDetails in MAL mode (your app supports "mal:12345"):contentReference[oaicite:2]{index=2}.
    const localMal = new Set((animeList || []).map(__getMalIdFromEntry).filter(Boolean));
    const missing = ids.filter(id => !localMal.has(Number(id)));

    // If you have a dedicated MAL-fetch function elsewhere, you can swap this block to use it.
    // For now: create lightweight placeholder entries so the list shows *something* immediately,
    // and your existing MAL enrichment logic can fill details when needed.
    for (const malId of missing) {
      animeList.push({
        id: `mal:${malId}`,
        title: `MAL #${malId}`,
        subtitle: '',
        image: '',
        seasons: [],
        malId: Number(malId)
      });
    }

    saveToLocalStorage?.();
    renderAnimeCards?.();
  } catch (e) {
    console.warn('loadListFromCloudAndHydrate failed:', e);
  }
}



/* ---------------------------- Search + Sorting ---------------------------- */
function sortAnimeList(list, sortBy) {
  if (!Array.isArray(list)) return [];
  const L = [...list];
  return L.sort((a, b) => {
    const aS = Array.isArray(a.seasons) ? a.seasons : [];
    const bS = Array.isArray(b.seasons) ? b.seasons : [];

// IMPORTANT: "recent/oldest" are handled by getFilteredList() using array order
if (sortBy === 'recent' || sortBy === 'oldest') return 0;


    if (sortBy.startsWith('title')) {
      const an = (a.title || '').toLowerCase();
      const bn = (b.title || '').toLowerCase();
      return sortBy.endsWith('asc') ? an.localeCompare(bn) : bn.localeCompare(an);
    }

    if (sortBy.startsWith('season')) {
      const A = aS.map(s => seasonKey(s.season)).sort((x,y) => y.y - x.y || y.o - x.o)[0] || { y:0, o:0 };
      const B = bS.map(s => seasonKey(s.season)).sort((x,y) => y.y - x.y || y.o - x.o)[0] || { y:0, o:0 };
      const cmp = (A.y === B.y) ? (A.o - B.o) : (A.y - B.y);
      return sortBy.endsWith('asc') ? cmp : -cmp;
    }

    if (sortBy.startsWith('episodes')) {
      const aE = aS.reduce((n, s) => n + (+s.episodes || 0), 0);
      const bE = bS.reduce((n, s) => n + (+s.episodes || 0), 0);
      return sortBy.endsWith('asc') ? aE - bE : bE - aE;
    }

    if (sortBy.startsWith('rating')) {
      const aR = aS.length ? Math.max(...aS.map(s => +s.rating || 0)) : 0;
      const bR = bS.length ? Math.max(...bS.map(s => +s.rating || 0)) : 0;
      return sortBy.endsWith('asc') ? aR - bR : bR - aR;
    }

    // NEW: MAL score (handles missing values last)
    if (sortBy === 'mal_asc' || sortBy === 'mal_desc') {
      const aM = Number.isFinite(+a.malScore) ? +a.malScore : (sortBy === 'mal_asc' ?  Infinity : -Infinity);
      const bM = Number.isFinite(+b.malScore) ? +b.malScore : (sortBy === 'mal_asc' ?  Infinity : -Infinity);
      return sortBy === 'mal_asc' ? (aM - bM) : (bM - aM);
    }

    return 0;
  });
}


function getFilteredList() {
  const term = (searchInput?.value || '').toLowerCase().trim();
  let list = Array.isArray(animeList) ? [...animeList] : [];

  // Text / rating filter
  if (term) {
    if (term.startsWith('rating:')) {
      const R = parseFloat(term.replace('rating:', ''));
      list = list.filter(a =>
        (a.seasons || []).some(s => Math.round(+s.rating || 0) === R)
      );
    } else {
      list = list.filter(a => {
        const hay = [
          (a.title || '').toLowerCase(),
          (a.genres || '').toLowerCase(),
          (a.themes || '').toLowerCase(),
          ...(a.seasons || []).flatMap(s => [
            (s.title || '').toLowerCase(),
            (s.format || '').toLowerCase(),
            (s.season || '').toLowerCase()
          ])
        ];
        return hay.some(x => x.includes(term));
      });
    }
  }

  // Status filter ONLY when not All
  if (activeStatusFilter && activeStatusFilter !== 'All') {
    list = list.filter(a => (a.status || 'Completed') === activeStatusFilter);
  }

  const sel = sortOption ? sortOption.value : 'recent';

  // Your NEW entries are inserted with `animeList.unshift(...)`,
  // so the natural order is already: newest → oldest.

  // Favorites = filter while keeping current (newest-first) order
  if (sel === 'favorites') {
    return list.filter(a => !!a.isFavorite);
  }

  // "Recently Added" = natural order (newest first)
  if (sel === 'recent') return list;

  // "Oldest Added" = reverse order (oldest first)
  if (sel === 'oldest') return list.slice().reverse();



  // All other sorts remain as-is
  return sortAnimeList(list, sel || 'recent');
}

/* ------------------------------ Grid Render ------------------------------- */

function renderAnimeCards() {
  if (UI?.viewMode === 'list') return renderAnimeList();  // self-routes to list
  animeGrid.classList.remove('list-mode');                // <-- back to cards
  const list = getFilteredList();
  animeGrid.innerHTML = '';

  if (list.length === 0) {
    const isFiltered =
      !!(searchInput && searchInput.value) ||
      (activeStatusFilter && activeStatusFilter !== 'All') ||
      ((sortOption?.value || '') === 'favorites');

    if (isFiltered) {
      animeGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h2>No Anime Found</h2>
          <p>Try changing your filters (status / favorites / sort).</p>
        </div>`;
    } else {
      animeGrid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-film"></i>
          <h2>Your Anime Watchlist is Empty</h2>
          <p>Start building your collection by clicking the "Add Anime" button to add your favorite shows.</p>
          <button id="addFirstAnimeBtn" class="btn"><i class="fas fa-plus"></i> Add Your First Anime</button>
        </div>`;
      $('#addFirstAnimeBtn')?.addEventListener('click', openAddModal);
    }
    refreshSidebarInfo();
renderHomePage();

    return;
  }

    list.forEach(anime => {
    const seasons = Array.isArray(anime.seasons) ? anime.seasons : [];

    // best personal rating (fallback to MAL score if needed)
    const ratingVals = seasons
      .map(s => parseFloat(s.rating))
      .filter(v => Number.isFinite(v) && v > 0);
    // Always use MAL score for the card rating pill (2 decimals)
   // Always use MAL score for the card rating pill (2 decimals)
  const malScoreRaw =
    anime?.malScore ??
    anime?.malInfo?.mean ??
    anime?.malInfo?.mean_score ??
    anime?.malInfo?.score ??
    anime?.malInfo?.node?.mean ??
    anime?.malInfo?.node?.score ??
    anime?.__malRaw?.mean ??
    anime?.__malRaw?.mean_score ??
    anime?.__malRaw?.score ??
    anime?.mean ??
    anime?.score ??
    null;

  // IMPORTANT: don't let "" become 0, and never show 0.00 when score is missing
  const malScoreStr = (malScoreRaw === null || malScoreRaw === undefined) ? '' : String(malScoreRaw).trim();
  const malScoreNum = (malScoreStr !== '' && Number.isFinite(+malScoreStr) && (+malScoreStr > 0))
    ? +malScoreStr
    : null;

  const ratingDisplay = (malScoreNum != null) ? malScoreNum.toFixed(2) : 'N/A';

    // premiered timeline (earliest valid season text)
    let premiered = 'N/A';
    if (seasons.length) {
      const tagged = seasons
        .map(s => ({
          raw: s.season,
          key: seasonKey(s.season)
        }))
        .filter(x => x.raw && x.key && x.key.y !== -Infinity);

      if (tagged.length) {
        tagged.sort((a, b) => (a.key.y - b.key.y) || (a.key.o - b.key.o));
        premiered = tagged[0].raw || 'N/A';
      } else {
        premiered = seasons[0].season || 'N/A';
      }
    }

        // format for card meta line (TV / Movie / Special / etc.)
    const rawType = (anime.subtitle || seasons[0]?.format || '').trim();

    // Normalize format casing:
    //  - TV / ONA / OVA stay uppercase
    //  - others become Capitalized (Movie, Special, Other, etc.)
    let formatDisplay;
    if (!rawType) {
      formatDisplay = 'N/A';
    } else if (/^tv$/i.test(rawType)) {
      formatDisplay = 'TV';
    } else if (/^ona$/i.test(rawType)) {
      formatDisplay = 'ONA';
    } else if (/^ova$/i.test(rawType)) {
      formatDisplay = 'OVA';
    } else if (/tv[\s-]*special/i.test(rawType)) {
      formatDisplay = 'Special';
    } else {
      formatDisplay = rawType
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
    }

    // CARD HOVER meta: "Format • Premiered Timeline"
    const metaLine = `${formatDisplay} • ${premiered}`;



       const card = document.createElement('div');
    card.className = 'anime-card';
    card.dataset.id = anime.id;
     card.innerHTML = `
      <div class="card-context">
        <div class="context-menu">
          <button class="context-option" data-action="edit"><i class="fas fa-edit"></i> Edit</button>
          <button class="context-option" data-action="delete"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
      <div class="card-image">
        ${anime.image ? `<img src="${anime.image}" alt="${anime.title}">` : '<i class="fas fa-image"></i>'}
      </div>
      <div class="card-overlay">
        <div class="card-rating-pill">${ratingDisplay}</div>
        ${anime.isFavorite ? '<div class="card-favorite-heart">⭐</div>' : ''}
        <div class="card-overlay-bottom">
          <h3 class="card-overlay-title">
            ${anime.title}
          </h3>
          <div class="card-overlay-meta">${metaLine}</div>
        </div>
      </div>`;

    __ensureMalScoreForPill(anime, card.querySelector('.card-rating-pill'));

    if (isBulkMode) card.classList.toggle('bulk-selected', bulkSelected.has(String(anime.id)));
    animeGrid.appendChild(card);
  });

  // no more scrolling marquee – just refresh sidebar info
  refreshSidebarInfo();

  // ✅ keep Home sections in sync after any list render/update
  renderHomePage();
}



/* ------------------------------ Home Render ------------------------------- */
function buildCardForHome(anime){
  const seasons = Array.isArray(anime.seasons) ? anime.seasons : [];

  // Always use MAL score for the card rating pill (2 decimals)
  const malScoreRaw =
    anime?.malScore ??
    anime?.malInfo?.mean ??
    anime?.malInfo?.mean_score ??
    anime?.malInfo?.score ??
    anime?.malInfo?.node?.mean ??
    anime?.malInfo?.node?.score ??
    anime?.__malRaw?.mean ??
    anime?.__malRaw?.mean_score ??
    anime?.__malRaw?.score ??
    anime?.mean ??
    anime?.score ??
    null;

  // IMPORTANT: don't let "" become 0, and never show 0.00 when score is missing
  const malScoreStr = (malScoreRaw === null || malScoreRaw === undefined) ? '' : String(malScoreRaw).trim();
  const malScoreNum = (malScoreStr !== '' && Number.isFinite(+malScoreStr) && (+malScoreStr > 0))
    ? +malScoreStr
    : null;

  const ratingDisplay = (malScoreNum != null) ? malScoreNum.toFixed(2) : 'N/A';

  // premiered timeline (earliest valid season text)
  let premiered = 'N/A';
  if (seasons.length) {
    const tagged = seasons
      .map(s => ({ raw: s.season, key: seasonKey(s.season) }))
      .filter(x => x.raw && x.key && x.key.y !== -Infinity);

    if (tagged.length) {
      tagged.sort((a, b) => (a.key.y - b.key.y) || (a.key.o - b.key.o));
      premiered = tagged[0].raw || 'N/A';
    } else {
      premiered = seasons[0].season || 'N/A';
    }
  }

  // format (TV/ONA/OVA uppercase, others Capitalized)
  const rawType = (anime.subtitle || seasons[0]?.format || '').trim();
  let formatDisplay;
  if (!rawType) formatDisplay = 'N/A';
  else if (/^tv$/i.test(rawType)) formatDisplay = 'TV';
  else if (/^ona$/i.test(rawType)) formatDisplay = 'ONA';
  else if (/^ova$/i.test(rawType)) formatDisplay = 'OVA';
  else if (/tv[\s-]*special/i.test(rawType)) formatDisplay = 'Special';
  else formatDisplay = rawType.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  const metaLine = `${formatDisplay} • ${premiered}`;

  const card = document.createElement('div');
  card.className = 'anime-card';
  card.dataset.id = anime.id;

  // EXACT same markup as your list grid cards
  card.innerHTML = `
    <div class="card-context">
      <div class="context-menu">
        <button class="context-option" data-action="edit"><i class="fas fa-edit"></i> Edit</button>
        <button class="context-option" data-action="delete"><i class="fas fa-trash"></i> Delete</button>
      </div>
    </div>
    <div class="card-image">
      ${anime.image ? `<img src="${anime.image}" alt="${anime.title}">` : '<i class="fas fa-image"></i>'}
    </div>
    <div class="card-overlay">
      <div class="card-rating-pill">${ratingDisplay}</div>
${isBulkMode ? `
  <label class="bulk-check bulk-check-card">
    <input class="bulk-checkbox" type="checkbox" data-bulk-check="${anime.id}" ${bulkSelected.has(String(anime.id)) ? 'checked' : ''} aria-label="Select entry">
  </label>
` : ''}

${anime.isFavorite ? 
'<div class="card-favorite-heart">⭐</div>' : ''}
        <div class="card-overlay-bottom">
          <h3 class="card-overlay-title">
            ${anime.title}
          </h3>
          <div class="card-overlay-meta">${metaLine}</div>
        </div>
      </div>`;

  __ensureMalScoreForPill(anime, card.querySelector('.card-rating-pill'));

  return card;
}

/* --------------------------- Home row arrow nav --------------------------- */
function __wireHomeRowShell(shell){
  if (!shell || shell.__rowNavWired) return;
  shell.__rowNavWired = true;

  const row  = shell.querySelector('.home-row');
  const prev = shell.querySelector('.home-row-nav.prev');
  const next = shell.querySelector('.home-row-nav.next');
  if (!row || !prev || !next) return;

  const step = () => Math.max(220, Math.floor(row.clientWidth * 0.85));

  prev.addEventListener('click', () => {
    row.scrollBy({ left: -step(), behavior: 'smooth' });
  });

  next.addEventListener('click', () => {
    row.scrollBy({ left: step(), behavior: 'smooth' });
  });

  const update = () => {
    const max = Math.max(0, row.scrollWidth - row.clientWidth);
    const overflow = max > 4;

    shell.dataset.noOverflow = overflow ? '0' : '1';

    if (!overflow) {
      prev.disabled = true;
      next.disabled = true;
      return;
    }

    prev.disabled = row.scrollLeft <= 2;
    next.disabled = row.scrollLeft >= (max - 2);
  };

  shell.__rowNavUpdate = update;

  row.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(update));

  requestAnimationFrame(update);
}

function __initHomeRowNav(){
  document.querySelectorAll('.home-row-shell').forEach(__wireHomeRowShell);
}

function __updateHomeRowNavFor(rowEl){
  const shell = rowEl?.closest?.('.home-row-shell');
  if (!shell) return;
  __wireHomeRowShell(shell);
  shell.__rowNavUpdate?.();
}

function __homeFormatKey(anime){
  const seasons = Array.isArray(anime?.seasons) ? anime.seasons : [];
  const raw = String(anime?.subtitle || seasons[0]?.format || '').trim();

  if (!raw) return 'Other';
  if (/^tv$/i.test(raw)) return 'TV';
  if (/^ona$/i.test(raw)) return 'ONA';
  if (/^ova$/i.test(raw)) return 'OVA';
  if (/^movie$/i.test(raw) || /^movies$/i.test(raw)) return 'Movie';
  return 'Other';
}

function __getHomeActiveFormat(sectionEl){
  const btn = sectionEl?.querySelector?.('.home-filter-chip.active');
  return String(btn?.dataset?.format || 'all').trim() || 'all';
}

function __renderHomeRowCards(rowEl, items, opts = {}){
  const { filtered = false, formatLabel = '' } = opts || {};
  rowEl.innerHTML = '';

  const limit = Number(rowEl.__homeLimit ?? 1000) || 1000;
  const sliced = (items || []).slice(0, limit);

  // 1) Not loaded yet / empty list => show “blank cards” placeholders
  if (!filtered && (!items || items.length === 0)) {
    for (let i = 0; i < 6; i++) {
      const sk = document.createElement('div');
      sk.className = 'home-skeleton';
      rowEl.appendChild(sk);
    }
    __updateHomeRowNavFor(rowEl);
    return;
  }

  // 2) Filter applied but nothing matches
  if (filtered && sliced.length === 0) {
    const box = document.createElement('div');
    box.className = 'home-empty-mini';
    box.textContent = formatLabel ? `No ${formatLabel} here` : 'No matches';
    rowEl.appendChild(box);
    __updateHomeRowNavFor(rowEl);
    return;
  }

  sliced.forEach(a => rowEl.appendChild(buildCardForHome(a)));
  __updateHomeRowNavFor(rowEl);
}

function __applyHomeSectionFilter(rowEl){
  if (!rowEl) return;

  const section = rowEl.closest?.('.home-section');
  const fmt = __getHomeActiveFormat(section);

  const full = Array.isArray(rowEl.__homeFullList) ? rowEl.__homeFullList : [];
  let filtered = full;
  let isFiltered = false;

  if (fmt && fmt !== 'all') {
    isFiltered = true;
    filtered = full.filter(a => __homeFormatKey(a) === fmt);
  }

  __renderHomeRowCards(rowEl, filtered, {
    filtered: isFiltered,
    formatLabel: (fmt === 'Movie') ? 'Movies' : fmt
  });
}

function fillHomeRow(rowEl, list, limit = 14){
  if (!rowEl) return;

  rowEl.__homeFullList = Array.isArray(list) ? list.slice() : [];
  rowEl.__homeLimit = limit;

  __applyHomeSectionFilter(rowEl);
}

function __initHomeSectionFilters(){
  document.querySelectorAll('.home-section').forEach((sec) => {
    const filters = sec.querySelector('.home-section-filters');
    if (!filters || filters.__wired) return;
    filters.__wired = true;

    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.home-filter-chip');
      if (!btn) return;

      filters.querySelectorAll('.home-filter-chip').forEach(b => {
        b.classList.toggle('active', b === btn);
      });

      const row = sec.querySelector('.home-row');
      if (row) __applyHomeSectionFilter(row);
    });
  });
}

// Spotlight state (kept stable between renders)
let __spotlightIds = [];
let __spotlightIndex = 0;

// Spotlight synopsis cache (so home spotlight can show real synopsis even when list endpoints don't include it)
const __spotlightSynopsisCache = new Map(); // malId -> string OR Promise<string>

function getNumericMalIdFromEntry(entry) {
  const raw = entry?.malId ?? entry?.mal_id ?? entry?.id ?? '';
  const s = String(raw);
  if (/^\d+$/.test(s)) return s;
  const m = s.match(/^mal:(\d+)$/);
  return m ? m[1] : null;
}

function fetchSpotlightSynopsis(malId) {
  const key = String(malId);
  const existing = __spotlightSynopsisCache.get(key);
  if (typeof existing === 'string') return Promise.resolve(existing);
  if (existing && typeof existing.then === 'function') return existing;

  const p = fetch(malApiUrl(`/api/anime/${encodeURIComponent(key)}?fields=synopsis`))
    .then(r => (r.ok ? r.json() : null))
    .then(j => {
      const syn = j?.data?.synopsis;
      return syn ? String(syn).trim() : '';
    })
    .catch(() => '');

  __spotlightSynopsisCache.set(key, p);
  return p.then(s => {
    __spotlightSynopsisCache.set(key, s || '');
    return s || '';
  });
}

// Home empty-state recommendations (when animeList is empty)
let __homeSpotlightPool = [];     // the objects Spotlight should read from
let __homeEmptyLoaded = false;    // cache flag so we don't refetch every render
let __homeEmptyLoading = false;

// helper: shuffle + pick N
function pickRandom(arr, n) {
  const a = (arr || []).slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// Map your MAL/Jikan-like objects into the SAME shape your Home cards expect
function malLikeToHomeEntry(x, fallbackSeasonLabel = '') {
  const malId = x?.mal_id ?? x?.id;

  const img =
    x?.images?.jpg?.large_image_url ||
    x?.images?.jpg?.image_url ||
    x?.images?.webp?.large_image_url ||
    x?.images?.webp?.image_url ||
    x?.image ||
    '';

  const seasonStr = x?.season || fallbackSeasonLabel || '';
  const typeStr = x?.type || x?.media_type || 'TV';

  const genres = Array.isArray(x?.genres)
    ? x.genres.map(g => g?.name).filter(Boolean).join(', ')
    : '';

  const episodes =
    (typeof x?.episodes === 'number' ? x.episodes : null) ??
    (typeof x?.num_episodes === 'number' ? x.num_episodes : null) ??
    0;

  // Some endpoints may not provide synopsis; Spotlight will fallback gracefully if empty.
  const synopsis =
    x?.synopsis ||
    x?.background ||
    '';

  return {
    id: `mal:${String(malId)}`,       // IMPORTANT: external key
    malId: String(malId),

    // Prefer English title when available, then fallback to default
    title: x?.title_english || x?.titles?.find(t => t.type === 'English')?.title || x?.title || '',
    titleEnglish: x?.title_english || x?.titles?.find(t => t.type === 'English')?.title || '',
    titleJapanese: x?.title_japanese || x?.titles?.find(t => t.type === 'Japanese')?.title || '',
    image: img,
    imageSource: 'mal',

    malScore: x?.score ?? x?.mean ?? null,
    subtitle: typeStr,

    genres,
    synopsis,

    seasons: [{
      season: seasonStr,
      format: typeStr,
      episodes: Number(episodes) || 0,
      duration: ''
    }],

    isFavorite: false
  };
}

async function loadHomeEmptyStateRecs() {
  if (__homeEmptyLoaded || __homeEmptyLoading) return;
  __homeEmptyLoading = true;

  try {
    const COUNT = 30;

    // ---- derive season labels ----
    const now = new Date();
    const month = now.getMonth() + 1;
    const curYear = now.getFullYear();

    const order = ['Winter', 'Spring', 'Summer', 'Fall'];
    const currentSeasonName =
      month <= 3 ? 'Winter' :
      month <= 6 ? 'Spring' :
      month <= 9 ? 'Summer' :
                   'Fall';

    const curIdx = order.indexOf(currentSeasonName);
    const nextIdx = (curIdx + 1) % 4;
    const prevIdx = (curIdx + 3) % 4;

    const nextYear = (currentSeasonName === 'Fall') ? (curYear + 1) : curYear;
    const prevYear = (currentSeasonName === 'Winter') ? (curYear - 1) : curYear;

    const currentSeasonLabel = `${currentSeasonName} ${curYear}`;
    const nextSeasonLabel = `${order[nextIdx]} ${nextYear}`;
    const lastSeasonLabel = `${order[prevIdx]} ${prevYear}`;

    const norm = (s) => String(s || '').trim().toLowerCase();
    const bySeason = (arr, label) => (arr || []).filter(x => norm(x?.season) === norm(label));
    const byYear = (arr, year) => (arr || []).filter(x => Number(x?.year) === Number(year));
    const sortByScoreDesc = (arr) => (arr || []).slice().sort((a, b) => (Number(b?.score) || 0) - (Number(a?.score) || 0));

    const keyId = (x) => x?.mal_id;

    const fillToCountUnique = (baseArr, extraArr, max = COUNT) => {
      const out = [];
      const seen = new Set();

      const add = (item) => {
        if (!item) return;
        const k = String(keyId(item) ?? '');
        if (!k || seen.has(k)) return;
        seen.add(k);
        out.push(item);
      };

      (baseArr || []).forEach(add);
      if (out.length < max) (extraArr || []).forEach(add);

      return out.slice(0, max);
    };

    // Fetch larger lists once, then slice down to COUNT
    const [popularRaw, airingRaw, upcomingRaw, allRaw] = await Promise.all([
      jikanFetchMostPopular({ limit: 120 }),
      jikanFetchTopAiring({ limit: 160 }),
      jikanFetchUpcoming({ limit: 160 }),
      jikanFetchTopAll({ limit: 250 })
    ]);

    // 1) Most popular
    const popular10 = (popularRaw || []).slice(0, COUNT).map(x => malLikeToHomeEntry(x)).filter(Boolean);

    // 2) Currently airing this season (prefer season-matched, then fallback)
    const airing10 = fillToCountUnique(
      bySeason(airingRaw, currentSeasonLabel),
      airingRaw
    ).map(x => malLikeToHomeEntry(x)).filter(Boolean);

    // 3) Upcoming next season (prefer season-matched, then fallback)
    const upcoming10 = fillToCountUnique(
      bySeason(upcomingRaw, nextSeasonLabel),
      upcomingRaw
    ).map(x => malLikeToHomeEntry(x)).filter(Boolean);

    // 4) Top anime current year (prefer year-matched from all ranking)
    const topYear10 = fillToCountUnique(
      sortByScoreDesc(byYear(allRaw, curYear)),
      sortByScoreDesc(allRaw)
    ).map(x => malLikeToHomeEntry(x)).filter(Boolean);

    // 5) Top anime last season (prefer season-matched from all ranking)
    const topLastSeason10 = fillToCountUnique(
      sortByScoreDesc(bySeason(allRaw, lastSeasonLabel)),
      sortByScoreDesc(allRaw)
    ).map(x => malLikeToHomeEntry(x)).filter(Boolean);

    // Spotlight pool = all 50 combined
    __homeSpotlightPool = [
      ...popular10,
      ...airing10,
      ...upcoming10,
      ...topYear10,
      ...topLastSeason10
    ];

    __spotlightIds = __homeSpotlightPool.map(a => String(a.id));
    __spotlightIndex = 0;

    // Fill all 5 home rows
    fillHomeRow(homeTopAiringRow, airing10, 1000);
    fillHomeRow(homeFavoritesRow, popular10, 1000);
    fillHomeRow(homeRecentRow, upcoming10, 1000);
    fillHomeRow(homeTopYearRow, topYear10, 1000);
    fillHomeRow(homeTopLastSeasonRow, topLastSeason10, 1000);

    __homeEmptyLoaded = true;
  } catch (e) {
    console.warn('Home empty-state MAL load failed:', e);
  } finally {
    __homeEmptyLoading = false;
  }
}

let __spotlightKey = '';

function renderHomePage() {
  if (!homeView) return;

  const all = Array.isArray(animeList) ? animeList.slice() : [];

  // ✅ HOME DISCOVERY: always use MAL recommendations (5 categories × 10)
  if (true) {
    // Kick off fetch once, then re-render when ready
    loadHomeEmptyStateRecs().then(() => {
      // only re-render if we're still on home
      if ((location.hash || '#home').startsWith('#home')) {
        // update spotlight UI after data arrives
        if (__spotlightIndex >= __spotlightIds.length) __spotlightIndex = 0;
        updateSpotlightUI();
      }
    });

    // Hide the old "Nothing here yet" cards by showing loading placeholders only once
    if (!__homeEmptyLoaded) {
      fillHomeRow(homeTopAiringRow, [], 1000);
      fillHomeRow(homeFavoritesRow, [], 1000);
      fillHomeRow(homeRecentRow, [], 1000);
      fillHomeRow(homeTopYearRow, [], 1000);
      fillHomeRow(homeTopLastSeasonRow, [], 1000);
    }

    // Spotlight uses home pool in empty state
    // (IDs are already prepared once load finishes)
    if (__spotlightIndex >= __spotlightIds.length) __spotlightIndex = 0;
    updateSpotlightUI();
    return;
  }

  // ✅ NORMAL STATE (your existing logic) — keep Spotlight reading from animeList
  __homeSpotlightPool = []; // IMPORTANT: clear so Spotlight reads animeList

  // Normalize "Fall 2022" from any messy season text
  const normSeasonLabel = (txt = '') => {
    const m = String(txt).match(/\b(Winter|Spring|Summer|Fall)\s+((?:19|20)\d{2})\b/i);
    if (!m) return null;
    const season = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
    const year = m[2];
    return `${season} ${year}`;
  };

  // Current season label from today's date
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const currentSeasonLabel =
    month <= 3 ? `Winter ${year}` :
    month <= 6 ? `Spring ${year}` :
    month <= 9 ? `Summer ${year}` :
                `Fall ${year}`;

  // Next season label
  const nextSeasonLabel = (() => {
    const order = ['Winter', 'Spring', 'Summer', 'Fall'];
    const curName = currentSeasonLabel.split(' ')[0];
    const curYear = parseInt(currentSeasonLabel.split(' ')[1], 10);

    const idx = order.indexOf(curName);
    const nextIdx = (idx + 1) % 4;
    const nextYear = (curName === 'Fall') ? (curYear + 1) : curYear;

    return `${order[nextIdx]} ${nextYear}`;
  })();

  // Top Airing = highest MAL score from CURRENT season timeline
  let topAiring = all
    .filter(a =>
      Array.isArray(a.seasons) &&
      a.seasons.some(s => normSeasonLabel(s.season) === currentSeasonLabel)
    )
    .slice()
    .sort((a, b) => (Number(b.malScore) || 0) - (Number(a.malScore) || 0));

  // Fallback: if you have nothing tagged as current season, don't show empty
  if (!topAiring.length) {
    topAiring = all
      .slice()
      .sort((a, b) => (Number(b.malScore) || 0) - (Number(a.malScore) || 0));
  }

  // Favorites
  const favs = all.filter(a => !!a.isFavorite);

  // Upcoming = entries from NEXT season timeline
  const upcoming = all
    .filter(a =>
      Array.isArray(a.seasons) &&
      a.seasons.some(s => normSeasonLabel(s.season) === nextSeasonLabel)
    )
    .slice()
    .sort((a, b) => (Number(b.malScore) || 0) - (Number(a.malScore) || 0));

  // --- Spotlight: pick random from ALL entries (cycles through everything) ---
  const idSet = new Set();
  const pool = [];
  (all || []).forEach(a => {
    const id = String(a?.id ?? '');
    if (!id || idSet.has(id)) return;
    idSet.add(id);
    pool.push(a);
  });

  const poolKey = pool.map(a => String(a.id)).join('|');
  if (poolKey !== __spotlightKey) {
    __spotlightKey = poolKey;
    __spotlightIndex = 0;

    const shuffled = pool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    __spotlightIds = shuffled.map(a => String(a.id));
  }

  if (__spotlightIndex >= __spotlightIds.length) __spotlightIndex = 0;
  updateSpotlightUI();

  // --- Rows ---
  fillHomeRow(homeTopAiringRow, topAiring, 1000);
  fillHomeRow(homeFavoritesRow, favs, 1000);
  fillHomeRow(homeRecentRow, upcoming, 1000);
}


function updateSpotlightUI({ watching = [], topAiring = [], upcoming = [] } = {}, opts = {}) {
  if (!homeSpotlight || !__spotlightIds.length) return;

  // swipe animation (direction: 'left' | 'right')
  const dir = opts?.direction;
  if (dir === 'left' || dir === 'right') {
    // wire cleanup once
    if (!homeSpotlight.__spotlightSwipeWired) {
      homeSpotlight.__spotlightSwipeWired = true;
      homeSpotlight.addEventListener('animationend', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('spotlight-inner')) {
          homeSpotlight.classList.remove('spotlight-swipe-left', 'spotlight-swipe-right');
        }
      });
    }

    homeSpotlight.classList.remove('spotlight-swipe-left', 'spotlight-swipe-right');
    // force restart animation
    void homeSpotlight.offsetWidth;
    homeSpotlight.classList.add(dir === 'left' ? 'spotlight-swipe-left' : 'spotlight-swipe-right');
  }

  const id = __spotlightIds[__spotlightIndex];
  const pool = (__homeSpotlightPool && __homeSpotlightPool.length) ? __homeSpotlightPool : (animeList || []);
const a = pool.find(x => String(x.id) === String(id));
  if (!a) return;


  // DefaultBackground ONLY: cover image is always the background
  const bg = (a.image || '');
  homeSpotlight.style.backgroundImage = bg ? `url("${bg}")` : '';

  homeSpotlight.style.backgroundSize = 'cover';
  homeSpotlight.style.backgroundPosition = 'center';
  homeSpotlight.style.backgroundRepeat = 'no-repeat';

  // ALWAYS blur, no matter what
  homeSpotlight.setAttribute('data-bg-blur', '1');

  // ALWAYS show cover overlay on top (if cover exists)
  if (spotlightCoverOverlay && spotlightCoverImg && a.image) {
    spotlightCoverOverlay.hidden = false;
    spotlightCoverImg.src = String(a.image);
    spotlightCoverImg.alt = a.title || 'Cover';
  } else if (spotlightCoverOverlay && spotlightCoverImg) {
    spotlightCoverOverlay.hidden = true;
    spotlightCoverImg.removeAttribute('src');
    spotlightCoverImg.alt = '';
  }



  // format (TV/ONA/OVA uppercase, others Capitalized)
  const seasons = Array.isArray(a.seasons) ? a.seasons : [];
  const rawType = (a.subtitle || seasons[0]?.format || '').trim();
  let formatDisplay;
  if (!rawType) formatDisplay = 'N/A';
  else if (/^tv$/i.test(rawType)) formatDisplay = 'TV';
  else if (/^ona$/i.test(rawType)) formatDisplay = 'ONA';
  else if (/^ova$/i.test(rawType)) formatDisplay = 'OVA';
  else if (/tv[\s-]*special/i.test(rawType)) formatDisplay = 'Special';
  else formatDisplay = rawType.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  // premiered (earliest season label)
  const seasonOrder = { Winter: 1, Spring: 2, Summer: 3, Fall: 4 };
  const parseSeason = (txt = '') => {
    const m = String(txt).match(/\b(Winter|Spring|Summer|Fall)\s+((?:19|20)\d{2})\b/i);
    if (!m) return null;
    const ssn = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
    const yy = parseInt(m[2], 10);
    return { label: `${ssn} ${yy}`, y: yy, o: seasonOrder[ssn] || 0 };
  };
  let premiered = 'N/A';
  const parsed = seasons.map(s => parseSeason(s?.season)).filter(Boolean);
  if (parsed.length) {
    parsed.sort((x, y) => (x.y - y.y) || (x.o - y.o));
    premiered = parsed[0].label || 'N/A';
  } else if (seasons[0]?.season) {
    premiered = seasons[0].season;
  }

  // spotlight meta: format • season • episodes OR duration
  const firstSeason = seasons[0] || {};
  const eps = Number(firstSeason.episodes) || 0;
  const dur = compactDuration(firstSeason.duration || '');

  let tail = '';
  if (eps > 1) {
    tail = `${eps} Eps`;
  } else if (eps === 1 && dur) {
    tail = dur;
  }

const genreText = String(a.genres || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean)
  .slice(0, 3)
  .join(', ');

// spotlight meta: Format • Genre(s) • Episodes/Duration
const metaParts = [
  formatDisplay || null,
  genreText || null,
  tail || null
].filter(Boolean);


  // title (English first; then fallback)
  const spotlightTitle =
    a?.malInfo?.englishTitle ||
    a?.englishTitle ||
    a?.titleEnglish ||
    a?.title_english ||
    a?.altTitles?.en ||
    a?.__malRaw?.alternative_titles?.en ||
    a?.title ||
    a?.title_japanese ||
    a?.titleJapanese ||
    a?.altTitles?.ja ||
    a?.__malRaw?.title ||
    'Untitled';

  if (spotlightTitleEl) spotlightTitleEl.textContent = spotlightTitle;

  // meta line
  if (spotlightMetaEl) spotlightMetaEl.textContent = metaParts.join(' • ');

  // description: prefer synopsis, else genres/themes line, else fallback
  // description: prefer synopsis; if missing, show a fallback immediately and fetch synopsis in the background
const cleanList = (s) => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
const genres = cleanList(a.genres).slice(0, 4);
const themes = cleanList(a.themes).slice(0, 4);

const MAX = 520;
const currentKey = String(a.id);

const synopsis = String(a.synopsis || '').trim();
const descIsSynopsis = !!synopsis;

let desc = synopsis;
if (!desc) {
  const g = genres.length ? `Genres: ${genres.join(', ')}` : '';
  const t = themes.length ? `Themes: ${themes.join(', ')}` : '';
  desc = [g, t].filter(Boolean).join(' • ');
}
if (!desc) desc = 'No description available.';

if (desc.length > MAX) desc = desc.slice(0, MAX).trimEnd() + '…';
if (spotlightDescEl) spotlightDescEl.textContent = desc;

// If we don't already have a synopsis (common on ranking/search endpoints), pull it once and update the UI.
if (!descIsSynopsis && spotlightDescEl) {
  const malIdNum = getNumericMalIdFromEntry(a);
  if (malIdNum) {
    fetchSpotlightSynopsis(malIdNum).then((syn) => {
      if (!syn) return;
      // cache onto the entry so next render is instant
      a.synopsis = syn;
      // only update if user is still looking at the same spotlight
      if (String(homeSpotlight.dataset.id) !== currentKey) return;
      let s = syn;
      if (s.length > MAX) s = s.slice(0, MAX).trimEnd() + '…';
      spotlightDescEl.textContent = s;
    });
  }
}


  // enable/disable nav if only 1
  const many = __spotlightIds.length > 1;
  spotlightNextBtn && (spotlightNextBtn.disabled = !many);
  spotlightPrevBtn && (spotlightPrevBtn.disabled = !many);

  // keep a data-id on the spotlight (handy for debugging / css hooks)
  homeSpotlight.dataset.id = String(a.id);
}


/* --------------------- Title overflow (simple marquee) -------------------- */
function setupCardTitleMarquees() {
  const SPEED = 60; // px / s
  requestAnimationFrame(() => {
    $$('.card-overlay-title.marquee').forEach(el => {
      let span = el.querySelector('.marquee-content');
      if (!span) {
        span = document.createElement('span');
        span.className = 'marquee-content';
        span.textContent = el.textContent;
        el.textContent = '';
        el.appendChild(span);
      }
      span.style.transform = 'translateX(0)';
      const dist = Math.max(0, span.scrollWidth - el.clientWidth);
      if (dist <= 0) {
        el.classList.add('no-scroll');
        el.style.setProperty('--marquee-distance', '0px');
        el.style.setProperty('--marquee-duration', '0s');
      } else {
        el.classList.remove('no-scroll');
        el.style.setProperty('--marquee-distance', dist + 'px');
        el.style.setProperty('--marquee-duration', Math.max(4, dist / SPEED).toFixed(2) + 's');
      }
    });
  });
}





function closeWithAnimation(modal) {
  if (modal === detailModal) closeDetailDrawer();
  if (!modal || !modal.classList.contains('active')) return;
  if (modal === detailModal && __bgLockOpen) return; // don't close while bg reposition open
  modal.classList.add('closing');
  modal.addEventListener('animationend', () => {
    modal.classList.remove('closing', 'active');
    if (modal === detailModal && detailModalContent) {
      detailModalContent.classList.remove('has-bg');

      // kill any old crossfade layers + reset bg so it doesn't show the last one
      detailModalContent.querySelectorAll('.detail-bg-xfade').forEach(n => n.remove());
      detailModalContent.querySelector('.detail-auto-bg')?.remove();
      try { window.applyDetailBackground(detailModalContent, null); } catch {}

      // also clear one-shot suppression in case a previous xfade got interrupted
      window.__suppressBgOnce = false;
    }
  }, { once: true });
}

function renderAnimeList() {
  let list = getFilteredList();

  animeGrid.innerHTML = '';
  animeGrid.classList.add('list-mode');

  if (list.length === 0) {
    animeGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-film"></i>
        <h2>No items to show</h2>
        <p>Switch filters or add a new anime.</p>
        <button id="addFirstAnimeBtn" class="btn"><i class="fas fa-plus"></i> Add Anime</button>
      </div>`;
    $('#addFirstAnimeBtn')?.addEventListener('click', openAddModal);
    refreshSidebarInfo?.();

    return;
  }

    const C = UI.listColumns;

  // 3-click head sort state (per current filtered list)
  const S = window.__lvSort || (window.__lvSort = { sig:'', base:[], col:'', c:0 });
  const sig = list.map(a=>String(a.id)).join('|');
  if (S.sig !== sig){ S.sig=sig; S.base=list.map(a=>String(a.id)); S.col=''; S.c=0; }

  const headCell = (txt, col) => col
    ? `<th class="lv-head" data-col="${col}" role="button" tabindex="0">${txt}</th>`
    : `<th>${txt||''}</th>`;

  const imgCell = (a) => `<td class="lv-picture">${a.image
    ? `<img src="${a.image}" alt="${(a.title||'').replace(/"/g,'&quot;')}" />`
    : '<i class="fas fa-image"></i>'}</td>`;

  const typeNorm = (t='') => {
    t = String(t||'').trim(); if (!t) return 'N/A';
    if (/^tv$/i.test(t)) return 'TV'; if (/^ona$/i.test(t)) return 'ONA'; if (/^ova$/i.test(t)) return 'OVA';
    if (/tv[\s-]*special/i.test(t)) return 'Special';
    return t.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  };

  const seasonKey = (s='') => {
    const m=/^(Winter|Spring|Summer|Fall)\s+(\d{4})$/i.exec(String(s));
    const o={winter:0,spring:1,summer:2,fall:3}[m?.[1]?.toLowerCase()] ?? 0;
    const y=+(m?.[2]??0); return {o,y};
  };
  const earliestSeason = (seasons=[]) => ([...seasons]
    .map(x=>({raw:x.season,key:seasonKey(x.season)}))
    .sort((a,b)=>(a.key.y-b.key.y)||(a.key.o-b.key.o))[0]?.raw) || 'N/A';

  const totalEps = (seasons=[]) => {
    const n = seasons.reduce((n,s)=>n+(+s.episodes||0),0);
    return n>0 ? n : 'N/A';
  };
  const firstDuration = (seasons=[]) => (seasons[0]?.duration || 'N/A');
  const bestUserRating = (seasons=[]) => {
    const v = seasons.map(s=>+s.rating||0).filter(n=>n>0);
    return v.length ? Math.max(...v).toFixed(1) : 'N/A';
  };

  const durMin = (x) => {
    x = String(x||'').trim(); if (!x || x==='N/A') return null;
    const h=/(\d+)\s*h/i.exec(x), m=/(\d+)\s*m/i.exec(x);
    const t=(h?+h[1]*60:0)+(m?+m[1]:0); return t||null;
  };
  const naLast = (a,b) => (a==null && b==null)?0:(a==null)?1:(b==null)?-1:null;

  const applySort = (arr) => {
    if (!S.col || S.c===0){
      const byId = new Map(arr.map(a=>[String(a.id),a]));
      return S.base.map(id=>byId.get(id)).filter(Boolean);
    }
    const typeA=['TV','Movie','ONA','Special','OVA'], typeB=['Other','OVA','Special','ONA','Movie','TV'];
    const stA=['Watching','Completed','On Hold','Plan to Watch','Dropped'], stB=['Dropped','Plan to Watch','On Hold','Completed','Watching'];

    return arr.slice().sort((a,b)=>{
      const mode = S.c; // 1 or 2
      const cmpNum = (x,y,hiFirst)=> hiFirst ? (y-x):(x-y);

      if (S.col==='title'){
        const A=(a.title||'').trim()||null, B=(b.title||'').trim()||null;
        const na=naLast(A,B); if(na!=null) return na;
        return mode===1 ? A.localeCompare(B,undefined,{sensitivity:'base'})
                        : B.localeCompare(A,undefined,{sensitivity:'base'});
      }
      if (S.col==='type'){
        const v=typeNorm(a.subtitle), w=typeNorm(b.subtitle);
        const A=(v==='N/A')?null:((mode===1?typeA:typeB).indexOf(v)); 
        const B=(w==='N/A')?null:((mode===1?typeA:typeB).indexOf(w));
        const na=naLast(A,B); if(na!=null) return na;
        return A-B;
      }
      if (S.col==='premiered'){
        const A=seasonKey(earliestSeason(a.seasons)), B=seasonKey(earliestSeason(b.seasons));
        const aNA=!A.y, bNA=!B.y; const na=naLast(aNA?null:1,bNA?null:1); if(na!=null) return na;
        return mode===1 ? (B.y-A.y)||(B.o-A.o) : (A.y-B.y)||(A.o-B.o);
      }
      if (S.col==='status'){
        const A=stA.indexOf(a.status||'Completed'), B=stA.indexOf(b.status||'Completed');
        const ra=(mode===1?A:stB.indexOf(a.status||'Completed'));
        const rb=(mode===1?B:stB.indexOf(b.status||'Completed'));
        return ra-rb;
      }
      if (S.col==='episodes'){
        const A = +(totalEps(a.seasons)); const B = +(totalEps(b.seasons));
        const aNA=!Number.isFinite(A), bNA=!Number.isFinite(B); const na=naLast(aNA?null:A,bNA?null:B); if(na!=null) return na;
        return cmpNum(A,B, mode===1);
      }
      if (S.col==='duration'){
        const A=durMin(firstDuration(a.seasons)), B=durMin(firstDuration(b.seasons));
        const na=naLast(A,B); if(na!=null) return na;
        return cmpNum(A,B, mode===1);
      }
      if (S.col==='mal'){
        const A=(a.malScore!=null && a.malScore!=='')?+a.malScore:null;
        const B=(b.malScore!=null && b.malScore!=='')?+b.malScore:null;
        const na=naLast(A,B); if(na!=null) return na;
        return cmpNum(A,B, mode===1);
      }
      if (S.col==='rating'){
        const A=+bestUserRating(a.seasons), B=+bestUserRating(b.seasons);
        const aNA=!Number.isFinite(A)||A<=0, bNA=!Number.isFinite(B)||B<=0;
        const na=naLast(aNA?null:A,bNA?null:B); if(na!=null) return na;
        return cmpNum(A,B, mode===1);
      }
      return 0;
    });
  };

  list = applySort(list);

const thead = `
  <thead><tr>
    ${isBulkMode ? `<th class="lv-bulk"></th>` : ''}
    ${C.picture  ? headCell('', null) : ''}
    ${C.title    ? headCell('Title','title') : ''}
    ${C.type     ? headCell('Type','type') : ''}
    ${C.season   ? headCell('Premiered','premiered') : ''}
    ${C.status   ? headCell('Status','status') : ''}
    ${C.genres   ? headCell('Genres',null) : ''}
    ${C.themes   ? headCell('Themes',null) : ''}
    ${C.episodes ? headCell('Episodes','episodes') : ''}
    ${C.duration ? headCell('Duration','duration') : ''}
    ${C.malScore ? headCell('MAL Score','mal') : ''}
    ${C.rating   ? headCell('Rating','rating') : ''}
  </tr></thead>`;

const rows = list.map(a => {
  const status = (a.status || 'Completed');
  const firstSeason = earliestSeason(a.seasons);
  const lower = String(firstSeason).toLowerCase();
  let seasonColor='';
  if (lower.startsWith('winter')) seasonColor='#c2f0fc';
  else if (lower.startsWith('spring')) seasonColor='#fcc2c2';
  else if (lower.startsWith('summer')) seasonColor='#fcfc88';
  else if (lower.startsWith('fall')) seasonColor='#cdfcc2';
  const seasonStyle = seasonColor ? ` style="color:${seasonColor};"` : '';

  const malText  = (a.malScore!=null && a.malScore!=='') ? Number(a.malScore).toFixed(2) : 'N/A';
  const ratingText = bestUserRating(a.seasons);
  const rowSelected = isBulkMode && bulkSelected.has(String(a.id));
  const rowClass = rowSelected ? 'anime-row bulk-selected' : 'anime-row';

  return `<tr class="${rowClass}" data-id="${a.id}">
    ${isBulkMode ? `
      <td class="lv-bulk">
        <label class="bulk-check">
          <input class="bulk-checkbox" type="checkbox" data-bulk-check="${a.id}" ${rowSelected ? 'checked' : ''} aria-label="Select entry">
        </label>
      </td>` : ''}
    ${C.picture  ? imgCell(a) : ''}
    ${C.title    ? `<td class="lv-title">
                      <button class="linklike lv-title-btn" data-open="${a.id}">
                        <span class="lv-title-text">${a.title || 'Untitled'}</span>
                        ${a.isAiringNow ? '<span class="lv-title-sub">Currently Airing</span>' : ''}
                      </button>
                    </td>` : ''}
    ${C.type     ? `<td>${typeNorm(a.subtitle)}</td>` : ''}
    ${C.season   ? `<td${seasonStyle}>${firstSeason}</td>` : ''}
    ${C.status   ? `<td class="lv-status"><span class="status-pill" data-status="${status}">${status}</span></td>` : ''}
      ${C.genres   ? `<td class="lv-tags">${a.genres || 'N/A'}</td>` : ''}
      ${C.themes   ? `<td class="lv-tags">${a.themes || 'N/A'}</td>` : ''}
      ${C.episodes ? `<td>${totalEps(a.seasons)}</td>` : ''}
      ${C.duration ? `<td>${firstDuration(a.seasons)}</td>` : ''}
      ${C.malScore ? `<td style="color:#acbcfa;">${malText}</td>` : ''}
      ${C.rating   ? `<td${ratingText!=='N/A' ? ' style="color:#fbbf24;"':''}>${ratingText}</td>` : ''}
    </tr>`;
  }).join('');

  animeGrid.innerHTML =
    `<div class="anime-list-wrap"><table class="anime-list ${C.picture ? 'has-pic' : ''}">${thead}<tbody>${rows}</tbody></table></div>`;

  // bind header clicks (3-click cycle)
  animeGrid.querySelectorAll('th.lv-head[data-col]').forEach(th => {
    const col = th.dataset.col;
    const step = () => { if (S.col!==col){S.col=col;S.c=0;} S.c=(S.c+1)%3; renderAnimeList(); };
    th.addEventListener('click', step);
    th.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' '){ e.preventDefault(); step(); } });
  });


  // enable marquee only for titles that actually overflow
  }





/* ---- Auto BG FX layer (blur + B&W for poster fallback) ---- */
function updateAutoBgFx(container) {
  // Disabled: was adding an extra overlay layer (.detail-auto-bg)
  try { container?.querySelectorAll?.('.detail-auto-bg')?.forEach(n => n.remove()); } catch {}
}



/* ----------------------------- Add/Edit Modal ---------------------------- */
function resetForm() {
  // Always try to reset the form safely
  if (animeForm) animeForm.reset();

  // Detect which modal layout is present
  const singleSeason = !!document.getElementById('animeSeason'); // new compact layout
  const multiSeason  = !!document.getElementById('seasonContainer'); // old multi-season layout

  if (multiSeason) {
    // Old layout (has #seasonContainer, addSeasonEntry, etc.)
    seasonContainer.innerHTML = '';
    addSeasonEntry?.();
    setDefaultTypeFormatSeasonForRow?.(0);
  } else if (singleSeason) {
    // New layout: set sane defaults, don’t touch missing nodes
    const typeSel   = document.getElementById('animeSubtitle');
    const seasonInp = document.getElementById('animeSeason');
    const statusSel = document.getElementById('animeStatus');
    const episodes  = document.getElementById('animeEpisodes');
    const duration  = document.getElementById('animeDuration');
    const rating    = document.getElementById('animeRating');
    const malScore  = document.getElementById('malScore');

    if (typeSel)   typeSel.value = 'TV';
    if (statusSel) statusSel.value = 'Completed';

    if (seasonInp) {
      const d = new Date();
      const seasons = ['Winter','Spring','Summer','Fall'];
      const s = seasons[Math.floor(d.getMonth()/3)%4];
      seasonInp.value = `${s} ${d.getFullYear()}`;
    }
    if (episodes) episodes.value = '';
    if (duration) duration.value = '';
    if (rating)   rating.value = '';
    if (malScore) malScore.value = '';
  }

  // Optional UI bits—guard them
  if (urlInputGroup) urlInputGroup.style.display = 'none';
  currentImage = null;
  if (imagePreview) imagePreview.innerHTML = '<i class="fas fa-image"></i>';
}
function openAddModal() {
  resetForm();
  $('#modalTitle').textContent = 'ADD NEW ENTRY';
  currentEditId = null;
  addEditModal.classList.add('active');
}

function openEditModal(id) {
  if (id) currentEditId = id;
  const a = (animeList || []).find(x => String(x.id) === String(currentEditId));
  if (!a) return;

  resetForm();
  $('#modalTitle').textContent = 'EDIT ENTRY';
  $('#animeTitle').value    = a.title || '';
  $('#animeSubtitle').value = a.subtitle || (a.seasons?.[0]?.format || 'TV');
  $('#animeGenres').value   = a.genres || '';
  $('#animeThemes').value   = a.themes || '';
  $('#animeStatus').value   = a.status || 'Completed';

  // single season -> populate fields from first season (if present)
  const s = (a.seasons && a.seasons[0]) ? a.seasons[0] : {};
  animeSeasonInput.value   = s.season   || '';
  animeEpisodesInput.value = s.episodes || '';
  animeDurationInput.value = s.duration || '24m';
  animeRatingInput.value   = (s.rating ?? '');

  // show MAL score if we have it saved
  if (typeof a.malScore === 'number') malScoreInput.value = a.malScore.toFixed(2);

  currentImage = a.image || null;
  imagePreview.innerHTML = currentImage ? `<img src="${currentImage}" alt="Preview">`
                                        : '<i class="fas fa-image"></i>';

  // remember if detail was open so we can restore after saving
window.__reopenDetailAfterSave = detailModal?.classList.contains('active') ? (currentEditId ?? id) : null;

// show edit (we still hide detail while editing so z-index doesn’t collide)
detailModal?.classList.remove('active');
addEditModal.classList.add('active');

}
function setDefaultTypeFormatSeasonForRow(rowIndex = 0) {
  const typeSel = $('#animeSubtitle'); if (typeSel) typeSel.value = 'TV';
  const fmt = $(`#format${rowIndex}`); if (fmt) fmt.value = 'TV';
  const ssn = $(`#season${rowIndex}`);
  if (ssn) {
    // Simple current season guess
    const d = new Date();
    const seasons = ['Winter','Spring','Summer','Fall'];
    const season = seasons[Math.floor(d.getMonth()/3)%4];
    ssn.value = `${season} ${d.getFullYear()}`;
  }
}
function addSeasonEntry() {
  const n = $$('.season-entry').length;
  const el = document.createElement('div');
  el.className = 'season-entry';
  el.innerHTML = `
    <div class="season-grid">
      <div class="form-group">
        <label for="title${n}">Title</label>
        <input type="text" id="title${n}" class="form-control" placeholder="eg. Season 2">
      </div>
      <div class="form-group">
        <label for="format${n}">Format</label>
        <input type="text" id="format${n}" class="form-control" placeholder="e.g. TV, Movie">
      </div>
      <div class="form-group">
        <label for="season${n}">Season</label>
        <input type="text" id="season${n}" class="form-control" placeholder="e.g. Fall 2016" required>
      </div>
      <div class="form-group">
        <label for="episodes${n}">Episodes</label>
        <input type="number" id="episodes${n}" class="form-control" min="1" placeholder="Number" required>
      </div>
      <div class="form-group">
        <label for="duration${n}">Duration</label>
        <input type="text" id="duration${n}" class="form-control" placeholder="24m or 1h 24m">
      </div>
      <div class="form-group">
        <label for="rating${n}">Rating (1-10)</label>
        <input type="number" id="rating${n}" class="form-control" min="1" max="10" step="0.1" placeholder="Rating" required>
      </div>
    </div>
    <button type="button" class="remove-season-btn" ${n === 0 ? 'style="display:none;"' : ''}>
      <i class="fas fa-times"></i> Remove
    </button>`;
  seasonContainer.appendChild(el);
  setupSeasonRemoveButtons();
}
function setupSeasonRemoveButtons() {
  $$('.remove-season-btn').forEach(btn => {
    btn.onclick = () => {
      const all = $$('.season-entry');
      if (all.length > 1) {
        btn.closest('.season-entry').remove();
        renumberSeasonEntries();
      }
    };
  });
}
function renumberSeasonEntries() {
  $$('.season-entry').forEach((entry, i) => {
    entry.querySelectorAll('[id]').forEach(ctrl => {
      const id = ctrl.id.replace(/\d+$/, i);
      ctrl.id = id;
    });
    const rm = entry.querySelector('.remove-season-btn');
    if (rm) rm.style.display = i === 0 ? 'none' : 'block';
  });
}


// Replace your handleImageUpload to store in IndexedDB
async function handleImageUpload(e) {
  const file = e.target.files?.[0];
  if (!file || !file.type.startsWith('image/')) { alert('Please select an image'); return; }

  // compress (reuse your compressor if you added one; here’s a tiny safe one):
  const dataUrl = await compressToWebpDataURL(file, { maxW: 1200, maxH: 1200, quality: 0.85, maxKB: 300 });
  const blob = dataURLtoBlob(dataUrl);

  // store in IDB
  currentImageId = await ImageStore.putBlob(blob);
  currentImageUrl = null;

  // preview
  currentImage && URL.revokeObjectURL(currentImage);
  currentImage = URL.createObjectURL(blob);
currentImageSource = 'manual';
imagePreview.innerHTML = `<img src="${currentImage}" alt="Preview">`;

}

// Simple compressor (use yours if you already have it)
async function compressToWebpDataURL(file, { maxW, maxH, quality, maxKB }) {
  const img = await new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => { URL.revokeObjectURL(url); res(i); };
    i.onerror = rej; i.src = url;
  });
  const r = Math.min(maxW / img.width, maxH / img.height, 1);
  const w = Math.round(img.width * r), h = Math.round(img.height * r);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d', { alpha: false }).drawImage(img, 0, 0, w, h);
  let q = quality, out;
  for (let tries = 0; tries < 5; tries++) {
    out = await new Promise(r => c.toBlob(r, 'image/webp', q));
    if (!out) break;
    if (out.size / 1024 <= maxKB || q <= 0.55) break;
    q -= 0.1;
  }
  return await new Promise((res) => {
    const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(out);
  });
}

function fitInside(sw, sh, maxW, maxH) {
  const r = Math.min(maxW / sw, maxH / sh, 1);
  return { w: Math.round(sw * r), h: Math.round(sh * r) };
}
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}



function handleImageUrl() {
  if (!imageUrl.value) return;
  const img = new Image();
  img.onload  = () => { currentImage = imageUrl.value; currentImageSource = 'manual'; imagePreview.innerHTML = `<img src="${currentImage}" alt="Preview">`; };

  img.onerror = () => { alert('Invalid image URL'); imageUrl.value = ''; };
  img.src = imageUrl.value;
}
function toggleUrlInput() {
  urlInputGroup.style.display = urlInputGroup.style.display === 'none' ? 'block' : 'none';
}

function saveAnime(e) {
  e.preventDefault();

  const title    = $('#animeTitle').value.trim();
  // normalize "TV Special" → "Special"
const rawType  = $('#animeSubtitle').value.trim() || 'TV';
const type     = /tv[\s-]*special/i.test(rawType) ? 'Special' : rawType;

  const genres   = $('#animeGenres').value.trim();
  const themes   = $('#animeThemes').value.trim();
  const status   = $('#animeStatus').value;

  const season   = animeSeasonInput.value.trim();
  const episodes = +(animeEpisodesInput.value || 0) || 0;
  const duration = compactDuration(animeDurationInput.value.trim() || '24m');

  const rating   = parseFloat(animeRatingInput.value) || ''; // your personal score
  const malScore = malScoreInput.value ? parseFloat(malScoreInput.value) : undefined;

   const oneSeason = [{ title: '', format: type, season, episodes, duration, rating }];

  if (currentEditId == null) {
    animeList.unshift({
      id: Date.now(),
      title, subtitle: type, genres, themes, image: currentImage, status,
      imageSource: currentImage ? (currentImageSource || 'manual') : undefined,
      seasons: oneSeason,
      malScore,
      malId: pendingMalId || undefined,
      isFavorite: false,
      detailBackground: null,
      detailBackgroundPos: { x:50, y:50, scale:1 }
    });
  } else {
    const idx = animeList.findIndex(a => String(a.id) === String(currentEditId));
    if (idx !== -1) {
      animeList[idx] = {
        ...animeList[idx],
        title, subtitle: type, genres, themes, status,
        image: currentImage || animeList[idx].image,
        imageSource: currentImage
          ? (currentImageSource || 'manual')   // new pick → record source
          : animeList[idx].imageSource,        // no change → keep old source
        seasons: oneSeason,
        malScore,
        malId: (pendingMalId ?? animeList[idx].malId)  // keep or update link
      };
    }
  }

 saveToLocalStorage();
renderAnimeCards();
closeWithAnimation(addEditModal);
showNotification('Saved Changes');

// if edit was opened from Detail, restore Detail (stays open per your requirement)
if (window.__reopenDetailAfterSave != null) {
  const backId = window.__reopenDetailAfterSave;
  window.__reopenDetailAfterSave = null;
  // avoid double-fade of background on immediate reopen
  window.__suppressBgOnce = true;
  openDetailModal(backId);
}

  currentImage = null;
  currentImageSource = null;
  pendingMalId = null; // avoid accidental linking on the next edit
}


/* ---------------- MAL Auto-Sync (STRICT by malId via Jikan) -------------
   - ONLY uses the malId attached to each entry (no title guessing)
   - On every page open, walks ALL entries that have malId and syncs them
   - Prefers ENGLISH title, then main title, then Japanese
   - Always refreshes MAL cover unless user uploaded a manual one
--------------------------------------------------------------------------- */

const MAL_AUTO_SYNC = {
  enabled: true,
  runOnInit: true,                 // ⬅ full sweep every time the page is opened
  intervalMs: 0,                   // 0 = no background interval (only on open)
  delayBetweenRequestsMs: 900      // small delay to keep Jikan happy
};

async function malFetch(url, env, { signal } = {}) {
  const res = await fetch(url, {
    signal,
    headers: { "X-MAL-CLIENT-ID": env.MAL_CLIENT_ID },
    cf: { cacheEverything: true, cacheTtl: 300 }
  });

  if (res.status === 429) return { error: "rate_limited", status: 429 };
  if (res.status === 404) return { error: "not_found", status: 404 };
  if (!res.ok) return { error: `mal_error_${res.status}`, status: res.status };

  return { data: await res.json(), status: 200 };
}

// Jikan fallback (no auth)
async function jikanFetch(url, { signal } = {}) {
  const res = await fetch(url, {
    signal,
    cf: { cacheEverything: true, cacheTtl: 600 } // 10 minutes
  });

  if (res.status === 429) return { error: "rate_limited", status: 429 };
  if (res.status === 404) return { error: "not_found", status: 404 };
  if (!res.ok) return { error: `jikan_error_${res.status}`, status: res.status };

  return { data: await res.json(), status: 200 };
}

function toNameList(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(x => ({ id: x?.mal_id ?? x?.id ?? null, name: x?.name || x?.title || "" }))
    .filter(x => x.name);
}






// Apply MAL data onto a local entry – always anchored by malId,
// prefer ENGLISH title, and also compute "isAiringNow".
function applyMALDiff(entry, item) {
  if (!item) return false;
  let changed = false;

  const joinNames = (arr) =>
    Array.isArray(arr)
      ? arr.map(x => x?.name || x?.title).filter(Boolean).join(', ')
      : '';

  const setInfo = (key, val) => {
    entry.malInfo = entry.malInfo || {};
    const v = (val == null) ? '' : String(val);
    if ((entry.malInfo[key] ?? '') !== v) {
      entry.malInfo[key] = v;
      changed = true;
    }
  };

  const normalizeDuration = (s = '') => {
    s = String(s).trim();
    if (!s) return '';
    // common Jikan: "24 min per ep"
    const min = s.match(/(\d+)\s*min/i);
    if (min) return `${min[1]}m`;
    // rare: "1 hr. 30 min"
    const hr = s.match(/(\d+)\s*hr/i);
    const mm = s.match(/(\d+)\s*min/i);
    if (hr && mm) return `${hr[1]}h ${mm[1]}m`;
    if (hr) return `${hr[1]}h`;
    return s.replace(/per\s*ep\.?/i, '').replace(/\s+/g, ' ').trim();
  };

  // 1) MAL ID (anchor)
  const malId =
    item.mal_id ??
    item.id ??
    item.node?.id ??
    item.anime?.mal_id ??
    item.anime?.id;

  if (malId && entry.malId !== malId) {
    entry.malId = malId;
    changed = true;
  }

  // 2) Titles (prefer English for entry.title, but store both EN/JP for Info panel)
  const englishTitleCandidates = [
    item.title_english,
    item.titles?.find(t => t.type === 'English')?.title,
    item.node?.title_english,
    item.anime?.title_english
  ].filter(Boolean);

  const fallbackTitleCandidates = [
    item.title,
    item.node?.title,
    item.anime?.title,
    item.titles?.[0]?.title
  ].filter(Boolean);

  const englishTitle = englishTitleCandidates[0] || '';
  const fallbackTitle = fallbackTitleCandidates[0] || '';
  const newTitle = englishTitle || fallbackTitle;

  if (newTitle && entry.title !== newTitle) {
    entry.title = newTitle;
    changed = true;
  }

  const japaneseTitle =
    item.title_japanese ||
    item.titles?.find(t => t.type === 'Japanese')?.title ||
    item.node?.title_japanese ||
    '';

  setInfo('englishTitle', englishTitle || newTitle || '');
  setInfo('japaneseTitle', japaneseTitle || '');

  // 3) Type/format
  const rawType =
    item.type ??
    item.media_type ??
    item.node?.type ??
    item.anime?.type ??
    entry.subtitle;

  let normalizedType = rawType ? String(rawType).toUpperCase() : '';
  if (normalizedType === 'TV_SERIES') normalizedType = 'TV';

  const s0 = entry.seasons && entry.seasons[0];

  if (!entry.seasons || !entry.seasons.length) {
    entry.seasons = [{
      title: '',
      format: normalizedType || '',
      season: '',
      episodes: null,
      duration: '',
      rating: null
    }];
    changed = true;
  } else if (normalizedType && s0 && s0.format !== normalizedType) {
    s0.format = normalizedType;
    changed = true;
  }

  if (normalizedType && entry.subtitle !== normalizedType) {
    entry.subtitle = normalizedType;
    changed = true;
  }

  // 3.5) Premiered/Season label (only fill if empty locally)
  const premieredText = (item.season && item.year)
    ? (String(item.season)[0].toUpperCase() + String(item.season).slice(1)) + ' ' + item.year
    : (item.aired?.string || '');

  const computedSeason = (typeof __computeSeasonFromMAL === 'function')
    ? (__computeSeasonFromMAL(item, premieredText) || premieredText)
    : premieredText;

  if (entry.seasons?.[0] && (!entry.seasons[0].season || !String(entry.seasons[0].season).trim()) && computedSeason) {
    entry.seasons[0].season = computedSeason;
    changed = true;
  }

  // 4) Episodes (only increase)
  const episodes =
    item.episodes ??
    item.num_episodes ??
    item.node?.episodes ??
    item.anime?.episodes;

  if (episodes != null && !isNaN(episodes) && entry.seasons?.[0]) {
    const epNum = Number(episodes);
    if (epNum > 0 && (!entry.seasons[0].episodes || epNum > entry.seasons[0].episodes)) {
      entry.seasons[0].episodes = epNum;
      changed = true;
    }
  }

  // 4.5) Duration (only fill if empty)
  const dur = normalizeDuration(item.duration || '');
  if (dur && entry.seasons?.[0] && (!entry.seasons[0].duration || !String(entry.seasons[0].duration).trim())) {
    entry.seasons[0].duration = dur;
    changed = true;
  }

  // 5) MAL score
  const malScore =
    item.mean_score ??
    item.score ??
    item.node?.mean ??
    item.node?.score ??
    item.anime?.score;

  if (malScore != null && malScore !== entry.malScore) {
    entry.malScore = malScore;
    changed = true;
  }

  // 6) Genres/Themes (keep separated; also fixes old entries where themes got stored as genres)
  const srcGenres = item.genres ?? item.node?.genres ?? item.anime?.genres ?? [];
  const srcThemes = item.themes ?? item.node?.themes ?? item.anime?.themes ?? [];

  const pickNames = (arr) => Array.isArray(arr)
    ? arr.map(x => x?.name || x?.title || '').map(s => String(s).trim()).filter(Boolean)
    : [];

  const dedupe = (arr) => {
    const seen = new Set();
    const out = [];
    for (const v of arr) {
      const k = v.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(v);
    }
    return out;
  };

  const splitCSV = (s) => String(s || '')
    .split(',')
    .map(x => String(x).trim())
    .filter(Boolean);

  const srcGenreNames = dedupe(pickNames(srcGenres));
  const srcThemeNames = dedupe(pickNames(srcThemes));
  const themeSet = new Set(srcThemeNames.map(s => s.toLowerCase()));

  let curGenres = splitCSV(entry.genres);
  let curThemes = splitCSV(entry.themes);

  // If Jikan gives themes, remove them from genres (fixes the bug)
  if (themeSet.size && curGenres.length) {
    const cleaned = curGenres.filter(g => !themeSet.has(g.toLowerCase()));
    if (cleaned.join(', ') !== curGenres.join(', ')) {
      curGenres = cleaned;
      entry.genres = cleaned.join(', ');
      changed = true;
    }
  }

  // Merge genres from source
  if (srcGenreNames.length) {
    const merged = dedupe([...curGenres, ...srcGenreNames]);
    const next = merged.join(', ');
    if (next !== (entry.genres || '')) {
      entry.genres = next;
      changed = true;
    }
  }

  // Merge themes from source
  if (srcThemeNames.length) {
    const merged = dedupe([...curThemes, ...srcThemeNames]);
    const next = merged.join(', ');
    if (next !== (entry.themes || '')) {
      entry.themes = next;
      changed = true;
    }
  }

  // 7) Cover image (refresh if NOT manual)
  const img =
    item.images?.jpg ??
    item.images?.webp ??
    item.node?.images?.jpg ??
    item.node?.images?.webp ??
    item.anime?.images?.jpg ??
    item.anime?.images?.webp;

  const imageUrl = img?.large_image_url || img?.image_url || img?.medium_image_url || '';

  if (imageUrl) {
    const src = entry.imageSource || '';
    const canOverwrite = !src || src === 'mal'; // NEVER overwrite manual
    if (canOverwrite && entry.image !== imageUrl) {
      entry.image = imageUrl;
      entry.imageSource = 'mal';
      changed = true;
    }
  }

  // 8) Airing flag
  const airingBool =
    item.airing ??
    item.airing_status ??
    item.node?.airing ??
    item.anime?.airing;

  let malStatusRaw =
    item.status ??
    item.airing_status ??
    item.node?.status ??
    item.anime?.status ??
    '';

  const malStatus = String(malStatusRaw).toLowerCase();

  const currentlyAiring =
    airingBool === true ||
    (malStatus.includes('airing') && !malStatus.includes('finished') && !malStatus.includes('complete'));

  if (entry.isAiringNow !== currentlyAiring) {
    entry.isAiringNow = currentlyAiring;
    changed = true;
  }

  // 9) Synopsis + Information panel fields
  const synopsis =
    item.synopsis ??
    item.node?.synopsis ??
    item.anime?.synopsis ??
    '';

  if ((synopsis || '') !== (entry.synopsis || '')) {
    entry.synopsis = synopsis || '';
    changed = true;
  }

 setInfo('status', item.status || '');
setInfo('aired', item.aired?.string || '');
setInfo('broadcast', item.broadcast?.string || '');
setInfo('producers', joinNames(item.producers));
setInfo('licensors', joinNames(item.licensors));
setInfo('studios', joinNames(item.studios));
setInfo('source', item.source || '');
setInfo('ageRating', item.rating || '');

// NEW: duration used by EntryDetails ("Duration (per ep.)")
setInfo('duration', item.duration || '');


  return changed;
}








/**
 * Sync a single entry STRICTLY by its malId
 */
async function syncEntryByMalId(entry) {
  if (!entry || !entry.malId) return false;

  const item = await malFetchFullById(entry.malId);
  if (!item) return false;

  return applyMALDiff(entry, item);
}

/**
 * Full sweep:
 * - Walks EVERY entry that has a malId
 * - Uses that malId only (no guessing by title)
 * - Saves to localStorage & re-renders if anything changed
 */
async function runMALSyncSweep(label = 'MAL sync (by ID)') {
  if (!MAL_AUTO_SYNC.enabled) return;
  if (!Array.isArray(animeList) || animeList.length === 0) return;

  const entries = animeList.filter(e => e && e.malId);
  if (!entries.length) return;

  let updated = 0;

  for (const entry of entries) {
    try {
      /* eslint-disable no-await-in-loop */
      const changed = await syncEntryByMalId(entry);

      if (changed) {
        updated++;

        // ✅ IMPORTANT: persist immediately so synopsis/info aren't "loaded-only"
        // (prevents data loss if the sweep is interrupted or you refresh mid-sync)
        saveToLocalStorage();
      }
    } catch (err) {
      console.error('MAL sync error for', entry?.malId, err);

      if (err && err._rateLimitHit) {
        // We already saved any changes as they happened, so it's safe to stop.
        break;
      }
    }

    if (typeof delay === 'function') {
      await delay(MAL_AUTO_SYNC.delayBetweenRequestsMs);
    } else {
      await new Promise(r => setTimeout(r, MAL_AUTO_SYNC.delayBetweenRequestsMs));
    }
  }

  if (updated) {
    renderAnimeCards();
    showNotification?.(
      `${label}: updated ${updated} entr${updated === 1 ? 'y' : 'ies'} from MAL`
    );
  }
}

/**
 * Start MAL auto-sync:
 * - Full, malId-only sweep ON EVERY PAGE OPEN
 * - Optional background interval (currently disabled: intervalMs = 0)
 */
function startMALAutoSync() {
  if (!MAL_AUTO_SYNC.enabled) return;

  if (MAL_AUTO_SYNC.runOnInit) {
    runMALSyncSweep('MAL sync (on page open)').catch(console.error);
  }

  if (MAL_AUTO_SYNC.intervalMs > 0) {
    setInterval(() => {
      runMALSyncSweep('MAL sync (interval)').catch(console.error);
    }, MAL_AUTO_SYNC.intervalMs);
  }
}



// --- show text or hide the entire row if empty ---
// --- show text or hide the entire row if empty / N/A ---
function setField(selector, value) {
  const valueEl = document.querySelector(selector);
  if (!valueEl) return;

  const row =
    valueEl.closest('[data-row]') ||
    valueEl.closest('.detail-row') ||
    valueEl.parentElement;

  let s = '';
  if (Array.isArray(value)) {
    s = value.map(v => String(v ?? '').trim()).filter(Boolean).join(', ');
  } else {
    s = String(value ?? '').trim();
  }

  const isEmpty = !s || /^n\/?a$/i.test(s);

  valueEl.textContent = isEmpty ? '' : s;

  if (row) {
    if (isEmpty) {
      row.setAttribute('hidden', '');
      row.style.display = 'none'; // extra-sure: removes the placeholder space
    } else {
      row.removeAttribute('hidden');
      row.style.display = '';
    }
  }
}




/* --------------------------- Detail Modal + nav --------------------------- */
function checkSeasonTitles(seasons) {
  return (seasons || []).every(s => !s.title || !s.title.trim());
}

function openDetailModal(id) {
  // DetailModal retired — route to full Entry Details page instead (NO MODALS)
  openEntryDetails(id);
  return;

  // (legacy DetailModal logic below left intact but unreachable)
  currentEditId = id;
  const a = getAnimeById(id);
  if (!a) return;


  // ensure no stale overlay survives a previous close + allow first bg apply
  detailModalContent?.querySelectorAll('.detail-bg-xfade').forEach(n => n.remove());
  window.__suppressBgOnce = false;

  closeDetailDrawer();

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = (text ?? '');
  };

  const pickPrimarySeason = (entry) => {
    const S = Array.isArray(entry?.seasons) ? entry.seasons : [];
    return S[0] || {};
  };

  // Title — show/hide if empty
  {
    const titleEl = $('#detailAnimeTitle');
    const title = (a.title || '').trim();
    if (titleEl) {
      titleEl.textContent = title;
      if (title) titleEl.removeAttribute('hidden');
      else titleEl.setAttribute('hidden', '');
    }
  }

    // Subtitle line: "TV • Action, Adventure • Isekai • Currently Airing"
  {
    const metaEl = $('#detailAnimeFormat');
    if (metaEl) {
      const typeRaw = (a.subtitle || pickPrimarySeason(a)?.format || '').trim();
      const type = /tv[\s-]*special/i.test(typeRaw) ? 'Special' : typeRaw;

      const genre  = (a.genres || '').trim();
      const theme  = (a.themes || '').trim();
      const airing = !!a.isAiringNow;

      const segs = [];
      if (type)  segs.push({ cls: 'dm-format',  txt: type });
      if (genre) segs.push({ cls: 'dm-genres',  txt: genre });
      if (theme) segs.push({ cls: 'dm-themes',  txt: theme });
      if (airing) segs.push({ cls: 'dm-airing', txt: 'Currently Airing' });

      metaEl.innerHTML = '';

      if (!segs.length) {
        metaEl.setAttribute('hidden', '');
      } else {
        const frag = document.createDocumentFragment();

        const addSeg = (txt, cls) => {
          const s = document.createElement('span');
          s.className = cls;
          s.textContent = txt;
          frag.appendChild(s);
        };

        const addDot = () => {
          const d = document.createElement('span');
          d.className = 'detail-dot';
          d.textContent = ' • ';
          frag.appendChild(d);
        };

        segs.forEach((seg, i) => {
          addSeg(seg.txt, seg.cls);
          if (i !== segs.length - 1) addDot(); // dot color stays intact (inherits)
        });

        metaEl.appendChild(frag);
        metaEl.removeAttribute('hidden');
      }
    }
  }

  // Poster
  const imgWrap = $('#detailAnimeImage');
  if (imgWrap) imgWrap.innerHTML = a.image ? `<img src="${a.image}" alt="${a.title}">` : '<i class="fas fa-image"></i>';

  // Background (KEEP EXACT behavior)
  const mode = (a.__bgMode ?? 'auto');
  const hasCustom = !!a.detailBackground;
  const usingFallbackPoster = (!hasCustom && mode !== 'none' && !!a.image);
  const bg = hasCustom ? a.detailBackground : (usingFallbackPoster ? a.image : '');
  const pos = a.detailBackgroundPos || { x:50, y:50, scale:1 };

  if (!window.__suppressBgOnce) {
    window.applyDetailBackground(detailModalContent, bg, pos);
  } else {
    window.__suppressBgOnce = false;
  }

  if (hasCustom ? !!a.detailBackgroundBlur : usingFallbackPoster) {
    detailModalContent?.setAttribute('data-bg-blur', '1');
  } else {
    detailModalContent?.removeAttribute('data-bg-blur');
  }

  updateAutoBgFx(detailModalContent, a.image || '', usingFallbackPoster);

  // Synopsis (from MAL sync)
  {
    const synEl = document.getElementById('detailSynopsis');
    if (synEl) synEl.textContent = (a.synopsis || a.malInfo?.synopsis || '').trim();
  }

   // Bottom stats (Premiered / Episodes / Duration / MAL Score / Rating)
{
  const s = pickPrimarySeason(a);

  setText('detailPremieredValue', NA(s.season));

  // Colorize Premiered (season) text
  {
    const premEl = document.getElementById('detailPremieredValue');
    if (premEl) {
      premEl.classList.remove('dm-season-winter','dm-season-spring','dm-season-summer','dm-season-fall');

      const premTxt = String(s.season || '').toLowerCase();
      if (premTxt.includes('winter')) premEl.classList.add('dm-season-winter');
      else if (premTxt.includes('spring')) premEl.classList.add('dm-season-spring');
      else if (premTxt.includes('summer')) premEl.classList.add('dm-season-summer');
      else if (premTxt.includes('fall')) premEl.classList.add('dm-season-fall');
    }
  }

  // If it's a single-episode entry, hide the Episodes stat entirely
  const epNum = Number(s.episodes);
  const isSingleEp = Number.isFinite(epNum) && epNum === 1;

  const epValEl = document.getElementById('detailEpisodesValue');
  const epStatEl = epValEl?.closest('.detail-stat');

  if (isSingleEp) {
    epStatEl?.setAttribute('hidden', '');
    setText('detailEpisodesValue', '');
  } else {
    epStatEl?.removeAttribute('hidden');
    setText('detailEpisodesValue', NA(epNum, { zeroIsNA: true }));
  }

  // Duration label: "Duration" for single-episode entries, otherwise keep "Duration (per ep.)"
  const durValEl = document.getElementById('detailDurationValue');
  const durStatEl = durValEl?.closest('.detail-stat');
  const durLabelEl = durStatEl?.querySelector('.detail-stat-label');
  if (durLabelEl) durLabelEl.textContent = isSingleEp ? 'Duration' : 'Duration (per ep.)';

  setText('detailDurationValue', NA(s.duration));

  const malTxt = (a.malScore != null && a.malScore !== '') ? Number(a.malScore).toFixed(2) : 'N/A';
  setText('detailMalScoreValue', malTxt);

  const ratingTxt = (s.rating !== '' && s.rating != null) ? `${Number(s.rating)}/10` : 'N/A';
  setText('detailRatingValue', ratingTxt);
}


  // Right sidebar: Information (hide empty/N/A rows so they don't take space)
  {
    const info = a.malInfo || {};

    setField('#detailInfoJapanese',  info.japaneseTitle);
    setField('#detailInfoEnglish',   info.englishTitle || a.title); // keep visible
    setField('#detailInfoStatus',    info.status || (a.isAiringNow ? 'Currently Airing' : ''));
    setField('#detailInfoAired',     info.aired);
    setField('#detailInfoBroadcast', info.broadcast);
    setField('#detailInfoProducers', info.producers);
    setField('#detailInfoLicensors', info.licensors);
    setField('#detailInfoStudios',   info.studios);
    setField('#detailInfoSource',    info.source);
    setField('#detailInfoAgeRating', info.ageRating);
  }


  // Relations (replaces "My Status")
// - hidden if no relations
// - shows linked entries (except itself)
// - clicking a relation opens that entry
(() => {
  const panel = document.getElementById('detailRelationsPanel');
  const listEl = document.getElementById('detailRelationsList');
  if (!panel || !listEl) return;

    const lr = a?.linkRelations || {};
  let relIds = [];

  if (Array.isArray(lr.groups)) {
    relIds = lr.groups.flatMap(g => Array.isArray(g?.linkedIds) ? g.linkedIds : []);
  } else {
    relIds = Array.isArray(lr.linkedIds) ? lr.linkedIds : [];
  }

  relIds = [...new Set(relIds.map(x => String(x)).filter(x => x !== String(a.id)))];


  listEl.innerHTML = '';

  if (!relIds.length) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = '';

  relIds.forEach(relId => {
    const rel = (animeList || []).find(x => String(x.id) === String(relId));
    if (!rel) return;

    const li = document.createElement('li');

    const link = document.createElement('a');
    link.href = '#';
    link.textContent = rel.title || 'Untitled';
    link.dataset.openRelation = String(rel.id);

    li.appendChild(link);
    listEl.appendChild(li);
  });
})();


  // update nav + fav state + key handlers
  currentFilteredList = getFilteredList();
  currentIndex = currentFilteredList.findIndex(x => String(x.id) === String(id));
  updateDetailNavButtons();
  updateFavoriteBtnUI(favoriteBtn, !!a.isFavorite);

  document.removeEventListener('keydown', handleDetailKeyDown);
  document.addEventListener('keydown', handleDetailKeyDown);

  detailModal.classList.add('active');
}


function getDetailStage() {
  const el = detailModal.querySelector('.detail-stage') ||
             detailModal.querySelector('.modal-content') ||
             detailModal.firstElementChild;
  if (el && !el.classList.contains('detail-stage')) el.classList.add('detail-stage');
  return el;
}
function handleDetailKeyDown(e) {
  const onlyDetailOpen = detailModal?.classList.contains('active') &&
    !addEditModal?.classList.contains('active') &&
    !ViewStats?.classList.contains('active') &&
    !importModal?.classList.contains('active');

  if (!onlyDetailOpen) return;

  if (e.key === 'ArrowLeft') { e.preventDefault(); showPreviousAnime(); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); showNextAnime(); }
  else if (e.key === 'Escape') {
    if (__bgLockOpen) { e.preventDefault(); return; }
    e.preventDefault(); closeModals();
  }
}
function showPreviousAnime() { if (currentIndex > 0) navigateDetail(-1); }
function showNextAnime()     { if (currentIndex < currentFilteredList.length - 1) navigateDetail(1); }



function playBgXfade(nextBg, nextPos = { x:50, y:50, scale:1 }, onDone, nextAuto = false) {
  if (!detailModalContent || !nextBg) { onDone && onDone(); return; }
  const img = new Image();
  img.onload = () => {
    const layer = document.createElement('div');
    layer.className = 'detail-bg-xfade';
    if (nextAuto) layer.classList.add('auto-fx'); // <-- key line

    // Compute cover size like applyDetailBackground does
    const rect = detailModalContent.getBoundingClientRect();
    const frameW = rect.width, frameH = rect.height;
    const imgW = img.naturalWidth, imgH = img.naturalHeight;
    const scale = typeof nextPos.scale === 'number' ? Math.max(1, Math.min(nextPos.scale, 3)) : 1;

    const imgR = imgW / imgH, frameR = frameW / frameH;
    let w, h;
    if (imgR > frameR) { h = frameH * scale; w = h * imgR; }
    else { w = frameW * scale; h = w / imgR; }
    const W = Math.ceil(w) + 2;
    const H = Math.ceil(h) + 2;

layer.style.backgroundImage = `url("${nextBg}")`;
layer.style.backgroundRepeat = 'no-repeat';
layer.style.backgroundSize = `${W}px ${H}px`;
layer.style.backgroundPosition = `${(nextPos.x ?? 50)}% ${(nextPos.y ?? 50)}%`;


    layer.addEventListener('animationend', () => {
try { window.applyDetailBackground(detailModalContent, nextBg, nextPos); } catch {}
try { applyBgPreview(); } catch {}

      layer.remove();
      onDone && onDone();
    }, { once: true });

    detailModalContent.querySelectorAll('.detail-bg-xfade').forEach(n => n.remove());
    detailModalContent.appendChild(layer);
  };
  img.onerror = () => { try { window.applyDetailBackground(detailModalContent, nextBg, nextPos); } catch {}; onDone && onDone(); };
  img.src = nextBg;
}

function swapToAnime(nextId, direction = 1) {
  const stage = getDetailStage();
  if (!stage || prefersReduced()) { openDetailModal(nextId); return; }

  const h = stage.offsetHeight;
  stage.style.minHeight = h + 'px';

  const outEls = [
    $('#detailAnimeImage'),
    $('#detailAnimeTitle'),
    $('#detailAnimeFormat'),
    $('#detailSynopsis'),
    detailModal.querySelector('.detail-stats'),
    detailModal.querySelector('.detail-side')
  ].filter(Boolean);
  outEls.forEach(el => el.classList.add('detail-data-fade-out'));

  const next = (animeList || []).find(a => String(a.id) === String(nextId));

  // match openDetailModal bg logic exactly (auto/custom/none)
  const nextMode = (next?.__bgMode ?? 'auto');
  const nextHasCustom = !!next?.detailBackground;
  const nextUsingPoster = (!nextHasCustom && nextMode !== 'none' && !!next?.image);
  const nextBg = nextHasCustom ? next.detailBackground : (nextUsingPoster ? next.image : '');

  const nextPos = next?.detailBackgroundPos || { x:50, y:50, scale:1 };
  const nextAuto = !!next && !nextHasCustom && (nextMode !== 'none') && !!next.image;

  setTimeout(() => {
    window.__suppressBgOnce = true;
    openDetailModal(nextId);

    playBgXfade(nextBg, nextPos, () => { stage.style.minHeight = ''; }, nextAuto);

    requestAnimationFrame(() => {
      const inEls = [
        $('#detailAnimeImage'),
        $('#detailAnimeTitle'),
        $('#detailAnimeFormat'),
        $('#detailSynopsis'),
        detailModal.querySelector('.detail-stats'),
        detailModal.querySelector('.detail-side')
      ].filter(Boolean);

      inEls.forEach(el => {
        el.classList.remove('detail-data-fade-out');
        el.classList.add('detail-data-fade-in');
        el.addEventListener('animationend', () => el.classList.remove('detail-data-fade-in'), { once: true });
      });
    });
  }, 180);
}
function navigateDetail(direction) {
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= currentFilteredList.length) return;
  const nextId = currentFilteredList[nextIndex].id;
  swapToAnime(nextId, direction);
}

// ===== Image Store (IndexedDB) =====
const ImageStore = (() => {
  const DB = 'anitrack-images';
  const STORE = 'images';
  let dbp;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function putBlob(blob, id = (crypto.randomUUID?.() || String(Date.now()))) {
    const db = await open();
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      tx.objectStore(STORE).put({ id, blob });
    });
    return id;
  }

  async function getBlob(id) {
    if (!id) return null;
    const db = await open();
    return await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(id);
      r.onsuccess = () => res(r.result?.blob || null);
      r.onerror = () => rej(r.error);
    });
  }

  async function del(id) {
    const db = await open();
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      tx.objectStore(STORE).delete(id);
    });
  }

  return { putBlob, getBlob, del };
})();

function dataURLtoBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const mime = /data:(.*?);base64/.exec(head)?.[1] || 'image/webp';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}



(async () => {
  if (navigator.storage?.persist) {
    try { await navigator.storage.persist(); } catch {}
  }
})();


/* ---------------------------- Detail Drawer UI ---------------------------- */
function closeDetailDrawer() {
  if (!detailActionDrawer) return;

  // Move focus OUT of the drawer before hiding it (prevents aria-hidden error)
  if (detailActionDrawer.contains(document.activeElement)) {
    (detailDrawerToggle || document.body).focus({ preventScroll: true });
  }

  // Hide the drawer accessibly
  detailActionDrawer.classList.remove('open');
  detailActionDrawer.setAttribute('aria-hidden', 'true');
  detailActionDrawer.setAttribute('inert', '');

  // 🔧 FIX: bring back the toggle so the panel can be reopened
  if (detailDrawerToggle) {
    detailDrawerToggle.setAttribute('aria-expanded', 'false');
    detailDrawerToggle.classList.remove('hidden'); // <-- critical line
  }
}

/* ------------------------------ Favorites --------------------------------- */
function updateFavoriteBtnUI(btn, isFav) {
  if (!btn) return;
  btn.classList.toggle('active', !!isFav);
  btn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
  const icon = btn.querySelector('i');
  if (icon) {
    icon.classList.remove('far', 'fas');
    icon.classList.add(isFav ? 'fas' : 'far');
    icon.classList.add('fa-star');
  }
}
function toggleFavorite() {
  if (currentEditId == null) return;
  const idx = (animeList || []).findIndex(a => a.id === currentEditId);
  if (idx === -1) return;

  const nowFav = !animeList[idx].isFavorite;
  animeList[idx].isFavorite = nowFav;
  saveToLocalStorage();

  updateFavoriteBtnUI(favoriteBtn, nowFav);
  showNotification(nowFav ? 'Added to favorites' : 'Removed from favorites');

  if (sortOption && sortOption.value === 'favorites') {
    renderAnimeCards();
    currentFilteredList = getFilteredList();
    currentIndex = currentFilteredList.findIndex(a => a.id === currentEditId);
  }
}

/* ------------------------------- Bulk Mode -------------------------------- */
function enterBulkMode() {
  isBulkMode = true;
  bulkSelected.clear();
  document.body.classList.add('bulk-mode');
  closeSidebarFn();
  renderAnimeCards();
  showBulkPanel(true);
  updateBulkCount();
  syncFloatingSidebarBulkBtn();
}
function exitBulkMode() {
  isBulkMode = false;
  bulkSelected.clear();
  document.body.classList.remove('bulk-mode');
  showBulkPanel(false);
  renderAnimeCards();
  syncFloatingSidebarBulkBtn();
}

function showBulkPanel(show) {
  if (!bulkPanel) return;
  bulkPanel.classList.toggle('show', !!show);
  bulkPanel.setAttribute('aria-hidden', show ? 'false' : 'true');
  if (show) {
    if (bulkSelectAll) bulkSelectAll.checked = false;
    if (bulkFav)       bulkFav.checked = false;
    if (bulkDelete)    bulkDelete.checked = false;
  }
}
function updateBulkCount() {
  const el = $('#bulkCount');
  if (el) el.textContent = `${bulkSelected.size} selected`;
}
function toggleSelectCard(id) {
  const key = String(id);
  if (bulkSelected.has(key)) bulkSelected.delete(key);
  else bulkSelected.add(key);

  const isOn = bulkSelected.has(key);

  // Toggle highlight on both card + list row (if present)
  [
    `.anime-card[data-id="${CSS.escape(String(id))}"]`,
    `.anime-row[data-id="${CSS.escape(String(id))}"]`
  ].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.classList.toggle('bulk-selected', isOn);
  });

  // ✅ Keep the new checkbox UI always in sync (row-click or checkbox-click)
  const cb = document.querySelector(`.bulk-checkbox[data-bulk-check="${CSS.escape(String(id))}"]`);
  if (cb) cb.checked = isOn;

  updateBulkCount();
}

function selectAllVisible(checked) {
  const list = getFilteredList();
  if (checked) list.forEach(a => bulkSelected.add(String(a.id)));
  else bulkSelected.clear();
  renderAnimeCards();
  updateBulkCount();
}


// Centralized modal closer (fixes "closeModals is not defined")
function closeModals() {
  if (__bgLockOpen) return; // don't close while background reposition is active
  document.removeEventListener('keydown', handleDetailKeyDown);
  currentFilteredList = [];
  currentIndex = -1;
  [addEditModal, importModal, ViewStats, detailModal].forEach(m => {
    if (m && m.classList?.contains('active')) closeWithAnimation(m);
  });
}


/* ---------------------------- Rearrange Mode ------------------------------ */
function getGridColumns(container, cards) {
  // rough guess using first row
  let cols = 1;
  const y = cards[0]?.getBoundingClientRect().top ?? 0;
  for (let i = 1; i < cards.length; i++) {
    if (Math.abs(cards[i].getBoundingClientRect().top - y) < 2) cols++;
    else break;
  }
  return Math.max(1, cols);
}

function highlightCard() {
  const isList = (typeof UI !== 'undefined' && UI?.viewMode === 'list');
  const selector = isList ? '.anime-row' : '.anime-card';
  const el = document.querySelector(`${selector}[data-id="${rearrangeCardId}"]`);
  if (el) {
    el.classList.add('rearrange-highlight');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
}

function removeHighlight() {
  const isList = (typeof UI !== 'undefined' && UI?.viewMode === 'list');
  const selector = isList ? '.anime-row' : '.anime-card';
  const el = document.querySelector(`${selector}[data-id="${rearrangeCardId}"]`);
  if (el) el.classList.remove('rearrange-highlight');
}

function startRearrangeMode() {
  if (currentEditId == null) return;
  closeModals();
  isRearrangeMode = true;
  rearrangeCardId = currentEditId;
  highlightCard();
  showNotification('Rearrange mode: use ↑/↓ to move, Enter to save, Esc to cancel.');
  document.addEventListener('keydown', handleRearrangeKeys, { passive: false });
}

function exitRearrangeMode(saveChanges = false) {
  if (!isRearrangeMode) return;
  removeHighlight();

  if (saveChanges) {
    const keepSort = sortOption ? (sortOption.value || 'recent') : 'recent';

    // ✅ Never rewrite IDs. IDs are the backbone of Link Relations.
    // Optional safety: re-sanitize relations before saving.
    try { repairLinkRelations?.(); } catch (_) {}

    saveToLocalStorage();
    if (sortOption) sortOption.value = keepSort;
    renderAnimeCards();
    showNotification('Rearrange saved.');
  } else {
    loadFromLocalStorage();
    renderAnimeCards();
    showNotification('Rearrange cancelled.');
  }

  isRearrangeMode = false;
  rearrangeCardId = null;
  document.removeEventListener('keydown', handleRearrangeKeys);
}

function handleRearrangeKeys(e) {
  if (!isRearrangeMode) return;

  // Enter / Esc work in both modes
  if (e.key === 'Enter') {
    e.preventDefault();
    exitRearrangeMode(true);
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    exitRearrangeMode(false);
    return;
  }

  const isList = (typeof UI !== 'undefined' && UI?.viewMode === 'list');

  // ---------- LIST VIEW (table rows, ↑ / ↓ only) ----------
  if (isList) {
    const container = animeGrid;
    if (!container) return;

    const tbody = container.querySelector('.anime-list tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('.anime-row'));
    if (!rows.length) return;

    const current = rows.find(r => String(r.dataset.id) === String(rearrangeCardId));
    if (!current) return;

    let step = 0;
    if (e.key === 'ArrowUp') step = -1;
    else if (e.key === 'ArrowDown') step = 1;
    else return; // ignore other keys in list mode

    const idx = rows.indexOf(current);
    const targetIdx = clamp(idx + step, 0, rows.length - 1);
    if (targetIdx === idx) return;

    e.preventDefault();

    const target = rows[targetIdx];
    if (targetIdx > idx) {
      target.after(current);
    } else {
      target.before(current);
    }

    // Sync backing data to current DOM order (only by visible IDs)
// ✅ Reorder ONLY the visible entries, do NOT disturb hidden entries.
const domOrderIds = Array.from(tbody.querySelectorAll('.anime-row'))
  .map(r => String(r.dataset.id));

const visibleSet = new Set(domOrderIds);
const reorderedVisible = domOrderIds
  .map(id => animeList.find(a => String(a.id) === id))
  .filter(Boolean);

let vi = 0;
animeList = animeList.map(a => {
  const key = String(a.id);
  if (visibleSet.has(key)) return reorderedVisible[vi++] || a;
  return a;
});

highlightCard();
return;

  }

  // ---------- CARD / GRID VIEW (existing behavior) ----------
  const container = animeGrid;
  if (!container) return;

  const cards = Array.from(container.querySelectorAll('.anime-card'));
  if (!cards.length) return;

  const current = cards.find(c => String(c.dataset.id) === String(rearrangeCardId));
  if (!current) return;

  const cols = getGridColumns(container, cards);
  let step = 0;
  if (e.key === 'ArrowLeft') step = -1;
  else if (e.key === 'ArrowRight') step = 1;
  else if (e.key === 'ArrowUp') step = -cols;
  else if (e.key === 'ArrowDown') step = cols;
  else return;

  if (!step) return;

  e.preventDefault();
  const idx = cards.indexOf(current);
  const targetIdx = clamp(idx + step, 0, cards.length - 1);
  if (targetIdx === idx) return;

  const target = cards[targetIdx];

  // simple visual hint when swapping cards
  current.classList.add('swapping');
  target.classList.add('swapping');

  const cRect = current.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();

  current.style.transform = `translate(${tRect.left - cRect.left}px, ${tRect.top - cRect.top}px)`;
  target.style.transform  = `translate(${cRect.left - tRect.left}px, ${cRect.top - tRect.top}px)`;

  if (targetIdx > idx) {
    target.after(current);
  } else {
    target.before(current);
  }

  requestAnimationFrame(() => {
    current.style.transform = 'translate(0,0)';
    target.style.transform  = 'translate(0,0)';
    current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  });

  const cleanup = (el) => {
    el.addEventListener('transitionend', function done() {
      el.removeEventListener('transitionend', done);
      el.classList.remove('swapping');
      el.style.transform = '';
    });
  };
  cleanup(current);
  cleanup(target);

 const domOrderIds = Array.from(container.querySelectorAll('.anime-card'))
  .map(c => String(c.dataset.id));

// ✅ Reorder ONLY the visible entries, do NOT disturb hidden entries.
const visibleSet = new Set(domOrderIds);
const reorderedVisible = domOrderIds
  .map(id => animeList.find(a => String(a.id) === id))
  .filter(Boolean);

let vi = 0;
animeList = animeList.map(a => {
  const key = String(a.id);
  if (visibleSet.has(key)) return reorderedVisible[vi++] || a;
  return a;
});

highlightCard();
}



/* ---- N/A helpers (prints "N/A" for empty values) ---- */
function NA(v, opts = {}) {
  const { zeroIsNA = false } = opts;
  if (v === null || v === undefined) return 'N/A';
  if (typeof v === 'number') return (zeroIsNA && v === 0) ? 'N/A' : String(v);
  const t = String(v).trim();
  return t ? t : 'N/A';
}



/* ------------------------------- Sidebar UI ------------------------------- */
function openSidebar() {
  sidebar.classList.add('open');
  if (!sidebarOverlay) {
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);
    sidebarOverlay.addEventListener('click', closeSidebarFn);
    requestAnimationFrame(() => sidebarOverlay.classList.add('show'));
  }
}
function removeSidebarOverlay() {
  if (!sidebarOverlay) return;
  sidebarOverlay.classList.remove('show');
  sidebarOverlay.addEventListener('transitionend', () => {
    if (sidebarOverlay && sidebarOverlay.parentNode) sidebarOverlay.parentNode.removeChild(sidebarOverlay);
    sidebarOverlay = null;
  }, { once: true });
}
function closeSidebarFn() {
  sidebar.classList.remove('open');
  removeSidebarOverlay();
}

/* ------------------------------ Sidebar info ------------------------------ */
function daysWatched(list) {
  let minutes = 0;
  list.forEach(a => (a.seasons || []).forEach(s => {
    minutes += parseDuration(s.duration) * (+s.episodes || 0);
  }));
  return (minutes / (60 * 24));
}

// Helper: only "Watching" entries
function getWatchingList() {
  return (animeList || []).filter(a => (a.status || 'Completed') === 'Completed');
}

const sbSlides = [
  {
    icon: 'fa-list',
    label: 'Total Entries',
    value: () => getWatchingList().length
  },
  {
    icon: 'fa-star',
    label: 'Avg Rating',
    value: () => {
      const src = getWatchingList();
      let t = 0, c = 0;
      src.forEach(a => (a.seasons || []).forEach(s => {
        const r = +s.rating;
        if (!Number.isNaN(r)) { t += r; c++; }
      }));
      return c ? (t / c).toFixed(2) : '0.00';
    }
  },
  {
    icon: 'fa-clock',
    label: 'Anime Days',
    value: () => daysWatched(getWatchingList()).toFixed(2)
  },
  {
    icon: 'fa-calendar',
    label: 'Elapsed Days',
    value: () => elapsedDays(trackingStartDate, trackingEndDate)
  }
];

function showSidebarInfo(index = 0) {
  const slide = sbSlides[(index % sbSlides.length + sbSlides.length) % sbSlides.length];
  if (!slide || !sidebarInfo) return;
  sbInfoIcon.className = `fas ${slide.icon}`;
  sbInfoValue.textContent = slide.value();
  sbInfoLabel.textContent = slide.label;
  sidebarInfo.classList.remove('tick'); void sidebarInfo.offsetWidth;
  sidebarInfo.classList.add('tick');
}
function nextSidebarInfo() { sbInfoIndex = (sbInfoIndex + 1) % sbSlides.length; showSidebarInfo(sbInfoIndex); }
function startSidebarTicker() { stopSidebarTicker(); sbInfoTimer = setInterval(nextSidebarInfo, 2000); }
function stopSidebarTicker()  { if (sbInfoTimer) clearInterval(sbInfoTimer); sbInfoTimer = null; }
function initSidebarInfoRotator() {
  if (!sidebarInfo) return;
  sidebarInfo.addEventListener('mouseenter', stopSidebarTicker);
  sidebarInfo.addEventListener('mouseleave', startSidebarTicker);
  showSidebarInfo(sbInfoIndex);
  startSidebarTicker();
}
function refreshSidebarInfo() { if (sidebarInfo) showSidebarInfo(sbInfoIndex); }



// Lightweight toast helper (optional)
function toast(msg) {
  let n = document.querySelector('.notification');
  if (!n) {
    n = document.createElement('div');
    n.className = 'notification';
    document.body.appendChild(n);
  }
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 1800);
}





/* ------------------------------ Import/Export ----------------------------- */
function exportData(format = 'json') {
  const payload = {
    animeList: (animeList || []).map(a => {
      const x = { ...a };
      if (x.detailBackground == null) delete x.detailBackground;
      return x;
    }),
    trackingStartDate: trackingStartDate ? trackingStartDate.toISOString() : null,
    trackingEndDate:   trackingEndDate ? trackingEndDate.toISOString() : null
  };

  const today = new Date().toISOString().slice(0, 10);
  let href, file;

  // helper for TXT export → one block per entry
  const buildTextExport = () => {
    const list = payload.animeList || [];
    if (!list.length) return 'No entries.';

    const blocks = list.map(entry => {
      const seasons = Array.isArray(entry.seasons) && entry.seasons.length
        ? entry.seasons
        : [{}];
      const s0 = seasons[0] || {};

      const name      = entry.title || 'Untitled';
      const formatStr = s0.format || entry.subtitle || 'N/A';
      const genres    = entry.genres || 'N/A';
      const themes    = entry.themes || 'N/A'; // single or comma list is fine
      const premiered = s0.season || 'N/A';
      const episodes  = s0.episodes || 'N/A';
      const duration  = s0.duration || 'N/A';

      return [
        `Name: ${name}`,
        `Format: ${formatStr}`,
        `Genres: ${genres}`,
        `Theme: ${themes}`,
        `Premiered: ${premiered}`,
        `Episodes: ${episodes}`,
        `Duration: ${duration}`
      ].join('\n');
    });

    return blocks.join('\n\n');
  };

  if (format === 'txt') {
    const text = buildTextExport();
    href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    file = `anitrack-export-${today}.txt`;
  } else if (format === 'xml') {
    // XML wrapper that carries the same JSON payload inside <payload>
    const jsonStr = JSON.stringify(payload);
    const esc = (str) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AniTrackExport>
  <exportedAt>${esc(new Date().toISOString())}</exportedAt>
  <payload>${esc(jsonStr)}</payload>
</AniTrackExport>`;

    href = 'data:application/xml;charset=utf-8,' + encodeURIComponent(xml);
    file = `anitrack-export-${today}.xml`;
  } else {
    // default: JSON (existing behaviour)
    const dataStr = JSON.stringify(payload, null, 2);
    href = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    file = `anitrack-export-${today}.json`;
  }

  const a = document.createElement('a');
  a.href = href;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderImportPreviewList({ title, meta, titles = [] }) {
  const shown = (titles || []).slice(0, 60);
  const itemsHtml = shown.length
    ? shown.map(t => `<li>${escapeHtml(t)}</li>`).join('')
    : `<li>Nothing to preview.</li>`;

  importPreview.innerHTML = `
    <div class="import-preview-header">
      <div class="import-preview-title">${escapeHtml(title || 'Import preview')}</div>
      ${meta ? `<div class="import-preview-meta">${escapeHtml(meta)}</div>` : ``}
    </div>
    <ol class="import-preview-list">${itemsHtml}</ol>
  `;
}

function handleFileImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const content = ev.target.result;
    if (content == null) {
      importPreview.textContent = 'Error reading file';
      processImportBtn.disabled = true;
      return;
    }

    const name = (file.name || '').toLowerCase();

    // IMPORTANT: strip BOM then trim
    const rawText = String(content).replace(/^\uFEFF/, '').trim();

    // --- AniTrack XML export (.xml) ---
    if (name.endsWith('.xml')) {
      try {
        const xmlDoc = new DOMParser().parseFromString(rawText, 'application/xml');
        if (xmlDoc.querySelector('parsererror')) throw new Error('Invalid XML');

        const payloadNode = xmlDoc.querySelector('payload');
        if (!payloadNode) throw new Error('No <payload> element found in AniTrack XML export.');

        const payloadText = (payloadNode.textContent || '').replace(/^\uFEFF/, '').trim();
        const data = JSON.parse(payloadText);

        // normalize
        const list = Array.isArray(data?.animeList) ? data.animeList : [];
        const titles = list.map(x => (x?.title || x?.name || 'Untitled').toString().trim() || 'Untitled');

        importPreview.dataset.rawContent = JSON.stringify(data);
        processImportBtn.dataset.importType = 'json';
        processImportBtn.disabled = titles.length === 0;

        renderImportPreviewList({
          title: `Found ${titles.length} entries`,
          meta: `Start: ${data.trackingStartDate || '-'} • End: ${data.trackingEndDate || '-'}${titles.length > 60 ? ' • Showing first 60' : ''}`,
          titles
        });
        return;
      } catch (err) {
        console.error('AniTrack XML import error:', err);
        importPreview.textContent = 'Error reading AniTrack XML export.';
        processImportBtn.disabled = true;
        delete processImportBtn.dataset.importType;
        delete importPreview.dataset.rawContent;
        return;
      }
    }

    // --- AniTrack JSON / TXT (.json / .txt) ---
    try {
      // Try JSON first (robust: object payload OR array)
      try {
        const parsed = JSON.parse(rawText);

        // Accept either { animeList:[...] } OR direct array export
        const data = Array.isArray(parsed)
          ? { animeList: parsed, trackingStartDate: null, trackingEndDate: null }
          : parsed;

        const list = Array.isArray(data?.animeList) ? data.animeList : [];
        if (!list.length) throw new Error('No entries found');

        const titles = list.map(x => (x?.title || x?.name || 'Untitled').toString().trim() || 'Untitled');

        importPreview.dataset.rawContent = JSON.stringify(data);
        processImportBtn.dataset.importType = 'json';
        processImportBtn.disabled = false;

        renderImportPreviewList({
          title: `Found ${titles.length} entries`,
          meta: `Start: ${data.trackingStartDate || '-'} • End: ${data.trackingEndDate || '-'}${titles.length > 60 ? ' • Showing first 60' : ''}`,
          titles
        });
        return;
      } catch (jsonErr) {
        // TXT fallback: each line = title
        const lines = rawText
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);

        // For TXT import, we still show list preview (not the raw text)
        const titles = lines.slice(0, 500); // keep a cap

        // store raw as text (keeps your processImport behavior)
        importPreview.dataset.rawContent = rawText;
        processImportBtn.dataset.importType = 'text';
        processImportBtn.disabled = titles.length === 0;

        renderImportPreviewList({
          title: `Text import (${lines.length} lines)`,
          meta: `${lines.length > 60 ? 'Showing first 60' : 'Showing all'}`,
          titles
        });
        return;
      }
    } catch (err) {
      console.error('Import read error:', err);
      importPreview.textContent = 'Error reading file';
      processImportBtn.disabled = true;
      delete processImportBtn.dataset.importType;
      delete importPreview.dataset.rawContent;
    }
  };

  reader.readAsText(file);
}

function processImport() {
  const kind = processImportBtn.dataset.importType;
  if (!kind) return;

  const normalizeStatus = (s) => {
    s = String(s || '').trim();
    const map = {
      watching: 'Watching',
      completed: 'Completed',
      'on hold': 'On Hold',
      'plan to watch': 'Plan to Watch',
      dropped: 'Dropped'
    };
    const key = s.toLowerCase();
    return map[key] || (s ? s : 'Completed');
  };

  const parseTxtExport = (text) => {
    // AniTrack TXT export = blocks separated by blank line
    // Each block:
    // Name: ...
    // Format: ...
    // Genres: ...
    // Theme: ...
    // Premiered: ...
    // Episodes: ...
    // Duration: ...
    const blocks = String(text || '')
      .replace(/^\uFEFF/, '')
      .trim()
      .split(/\n\s*\n+/)
      .map(b => b.trim())
      .filter(Boolean);

    const items = [];

    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const get = (key) => {
        const line = lines.find(x => x.toLowerCase().startsWith(key.toLowerCase() + ':'));
        return line ? line.split(':').slice(1).join(':').trim() : '';
      };

      const title = get('Name');
      if (!title || title.toLowerCase() === 'no entries.') return;

      const format    = get('Format');
      const genres    = get('Genres');
      const themes    = get('Theme');
      const premiered = get('Premiered');
      const episodes  = get('Episodes');
      const duration  = get('Duration');

      const epNum = Number(episodes);
      items.push({
        id: Date.now() + Math.random(),
        title,
        subtitle: format || 'TV',
        genres: genres && genres !== 'N/A' ? genres : '',
        themes: themes && themes !== 'N/A' ? themes : '',
        status: normalizeStatus('Completed'),
        image: null,
        isFavorite: false,
        seasons: [{
          title: '',
          format: format && format !== 'N/A' ? format : '',
          season: premiered && premiered !== 'N/A' ? premiered : '',
          episodes: Number.isFinite(epNum) ? epNum : null,
          duration: duration && duration !== 'N/A' ? duration : '',
          rating: null
        }]
      });
    });

    return items;
  };

  const dedupeMerge = (incoming) => {
    const existing = Array.isArray(animeList) ? animeList : [];
    const out = [...existing];

    incoming.forEach(n => {
      if (!n || !n.title) return;

      const exists = out.some(a =>
        String(a.title || '').toLowerCase() === String(n.title).toLowerCase()
      );

      if (!exists) out.unshift(n); // add to top
    });

    return out;
  };

  try {
    const raw = importPreview.dataset.rawContent;
    if (!raw) return;

    let imported = [];

    if (kind === 'json') {
      const parsed = JSON.parse(raw);

      // accept either { animeList:[...] } OR direct array
      const data = Array.isArray(parsed) ? { animeList: parsed } : parsed;

      if (data.trackingStartDate) trackingStartDate = new Date(data.trackingStartDate);
      if (data.trackingEndDate)   trackingEndDate   = new Date(data.trackingEndDate);

      imported = Array.isArray(data.animeList) ? data.animeList : [];
      if (!imported.length) throw new Error('No valid entries in file.');

      // ensure each imported entry has an id
      imported = imported.map(x => ({
        ...x,
        id: x.id ?? (Date.now() + Math.random())
      }));
    }

    if (kind === 'text') {
      imported = parseTxtExport(raw);
      if (!imported.length) throw new Error('No valid entries found in TXT.');
    }

    animeList = dedupeMerge(imported);
    saveToLocalStorage();
    renderAnimeCards();
    refreshSidebarInfo?.();

    alert(`Imported ${imported.length} entries!`);
  } catch (e) {
    alert('Error during import: ' + e.message);
  } finally {
    importFile.value = '';
    importPreview.innerHTML = `<div class="import-preview-empty">Upload a file to preview entries…</div>`;
    processImportBtn.disabled = true;
    delete processImportBtn.dataset.importType;
    delete importPreview.dataset.rawContent;
    importModal.classList.remove('active');
  }
}



function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}



function resetData() {
  if (!confirm('Reset ALL data? This cannot be undone.')) return;
  animeList = [];
  trackingStartDate = new Date('2023-01-01');
  trackingEndDate   = new Date();
  saveToLocalStorage();
  renderAnimeCards();
  alert('All data has been reset.');
}

/* ------------------------------ Stats (Modal) ----------------------------- */
function statsModeTitle(mode) { return (mode === 'All') ? 'Total Entries' : `${mode}`; }
function elapsedUIUpdate() {
  const s = startDateInput?.valueAsDate || trackingStartDate || new Date('2023-01-01');
  const e = endDateInput?.valueAsDate   || new Date();
  modalElapsedDays.textContent = elapsedDays(s, e);
}
function getCompleted(list = (animeList || [])) {
  return list.filter(a => (a.status || 'Completed') === 'Completed');
}
function getByStatus(mode = 'Completed') {
  if (mode === 'All') return [...(animeList || [])];
  return (animeList || []).filter(a => (a.status || 'Completed') === mode);
}
function renderStatsFor(mode) {
  const src = getByStatus(mode);
  const totalEntries = src.length;
  const totalEps = src.reduce((sum, a) =>
    sum + (a.seasons || []).reduce((s, z) => s + (+z.episodes || 0), 0), 0);

  let t = 0, c = 0;
  src.forEach(a => (a.seasons || []).forEach(s => {
    const r = +s.rating; if (!Number.isNaN(r)) { t += r; c++; }
  }));
  const avg = c ? (t / c).toFixed(2) : '0.00';

  let minutes = 0;
  src.forEach(a => (a.seasons || []).forEach(s => {
    minutes += parseDuration(s.duration) * (+s.episodes || 0);
  }));
  const days = minutes / (60 * 24);

  if (statsModeLabelEl) statsModeLabelEl.textContent = statsModeTitle(mode);
  if (modalTotalEntries)  modalTotalEntries.textContent  = totalEntries;
  if (modalTotalEpisodes) modalTotalEpisodes.textContent = totalEps;
  if (modalAverageRating) modalAverageRating.textContent = avg;
  if (modalAnimeDays)     modalAnimeDays.textContent     = days.toFixed(2);

  generateTopGenres(src);
  generateSeasonalStats(currentStatsYear, src);
  generateScoreDistribution(src);
  generateFormatDistribution(src);
}

function generateTopGenres(list = getCompleted()) {
  const genreCount = {}, themeCount = {};
  list.forEach(a => {
    (a.genres || '').split(',').map(s => s.trim()).filter(Boolean).forEach(g => genreCount[g] = (genreCount[g] || 0) + 1);
    (a.themes || '').split(',').map(s => s.trim()).filter(Boolean).forEach(t => themeCount[t] = (themeCount[t] || 0) + 1);
  });
  const items = [
    ...Object.entries(genreCount).map(([name, count]) => ({ name, count, type: 'genre' })),
    ...Object.entries(themeCount).map(([name, count]) => ({ name, count, type: 'theme' })),
  ].sort((a, b) => b.count - a.count);

  const max = items.length ? items[0].count : 1;
  const html = items.map(it => {
    const w = (it.count / max) * 100;
    const label = it.type === 'theme' ? `${it.name}<span class="type-subtext">theme</span>` : it.name;
    return `
      <div class="genre-row">
        <div class="bar-container">
          <div class="genre-bar" style="width:${w}%">
            <span class="bar-label">${label}</span>
            <span class="bar-value">${it.count}</span>
          </div>
        </div>
      </div>`;
  }).join('');
  const c = $('#topGenres');
  if (c) { c.innerHTML = html; c.classList.add('scrollable'); }
}
function generateSeasonalStats(year, list = getCompleted()) {
  const seasons = ['Winter','Spring','Summer','Fall'];
  const colors = {
    Winter: 'linear-gradient(45deg, #1e3a8a, #60a5fa)',
    Spring: 'linear-gradient(45deg, #7e22ce, #f472b6)',
    Summer: 'linear-gradient(45deg, #d97706, #facc15)',
    Fall:   'linear-gradient(45deg, #15803d, #4ade80)'
  };
  const counts = { Winter:0, Spring:0, Summer:0, Fall:0 };
  list.forEach(a => (a.seasons || []).forEach(s => {
    const txt = String(s.season || '');
    if (txt.includes(String(year))) { seasons.forEach(name => { if (txt.includes(name)) counts[name]++; }); }
  }));
  const max = Math.max(...Object.values(counts), 0);
  const html = seasons.map(name => {
    const count = counts[name] || 0;
    const w = max ? (count / max) * 100 : 0;
    return `
      <div class="season-row">
        <div class="bar-container">
          <div class="season-bar" style="width:${w}%;background:${colors[name]}">
            <span class="bar-label">${name}</span>
            <span class="bar-value">${count}</span>
          </div>
        </div>
      </div>`;
  }).join('');
  $('#seasonalStats').innerHTML = html;
  $('#currentYearDisplay').textContent = year;
}
function generateScoreDistribution(list = getCompleted()) {
  const counts = {}; for (let i = 1; i <= 10; i++) counts[i] = 0;
  list.forEach(a => (a.seasons || []).forEach(s => {
    const r = Math.round(+s.rating || 0); if (r >= 1 && r <= 10) counts[r]++;
  }));
  const max = Math.max(...Object.values(counts), 0);
  let html = '';
  for (let r = 10; r >= 1; r--) {
    const c = counts[r] || 0; const w = max ? (c / max * 100) : 0;
    html += `
      <div class="score-row">
        <div class="bar-container">
          <div class="score-bar" style="width:${w}%">
            <span class="bar-label">${r}</span>
            <span class="bar-value">${c}</span>
          </div>
        </div>
      </div>`;
  }
  const container = $('#scoreDistribution');
  if (container) { container.innerHTML = html; container.classList.add('scrollable'); }
}
function generateFormatDistribution(list = getCompleted()) {
  const formats = { TV:0, Movie:0, ONA:0, OVA:0, Special:0, Other:0 };
  list.forEach(a => (a.seasons || []).forEach(s => {
    const f = String(s.format || '').toLowerCase();
let key = 'Other';
// treat "tv special", "tv-special", "tvspecial" as Special
if (/tv[\s-]*special/.test(f) || (f.includes('tv') && f.includes('special'))) key = 'Special';
else if (f.includes('special')) key = 'Special';
else if (f.includes('tv') || f.includes('season') || f.includes('part')) key = 'TV';
else if (f.includes('movie')) key = 'Movie';
else if (f.includes('ona'))   key = 'ONA';
else if (f.includes('ova'))   key = 'OVA';
formats[key]++;


  }));
  const order = ['TV','Movie','ONA','OVA','Special','Other'];
 const max = Math.max(...order.map(k => formats[k] || 0), 0); 
  const html = order.map(k => {
    const c = formats[k] || 0; const w = max ? (c / max) * 100 : 0;
    return `
      <div class="format-row">
        <div class="bar-container">
          <div class="format-bar" style="width:${w}%">
            <span class="bar-label">${k}</span>
            <span class="bar-value">${c}</span>
          </div>
        </div>
      </div>`;
  }).join('');
  const container = $('#formatDistribution');
  if (container) { container.innerHTML = html; container.classList.add('scrollable'); }
}


function openStatsModal() {
  StatsMode = activeStatusFilter || 'Completed';
  if (startDateInput) startDateInput.valueAsDate = trackingStartDate;
  if (endDateInput)   endDateInput.valueAsDate   = new Date();
  elapsedUIUpdate();
  renderStatsFor(StatsMode);

  if (statsModePrevBtn && !statsModePrevBtn.__wired) {
    statsModePrevBtn.addEventListener('click', () => cycleStatsMode(-1));
    statsModePrevBtn.__wired = true;
  }
  if (statsModeNextBtn && !statsModeNextBtn.__wired) {
    statsModeNextBtn.addEventListener('click', () => cycleStatsMode(1));
    statsModeNextBtn.__wired = true;
  }

  // Year navigation for Seasonal Distribution
  if (prevYearBtn && !prevYearBtn.__wired) {
    prevYearBtn.addEventListener('click', () => {
      currentStatsYear--;
      const src = getByStatus(StatsMode);
      generateSeasonalStats(currentStatsYear, src);
      if (!prefersReduced()) animateBars(ViewStats);
    });
    prevYearBtn.__wired = true;
  }

  if (nextYearBtn && !nextYearBtn.__wired) {
    nextYearBtn.addEventListener('click', () => {
      currentStatsYear++;
      const src = getByStatus(StatsMode);
      generateSeasonalStats(currentStatsYear, src);
      if (!prefersReduced()) animateBars(ViewStats);
    });
    nextYearBtn.__wired = true;
  }

  document.querySelector('.period-options-menu')?.classList.remove('show');
  ViewStats.classList.add('active');

  if (!prefersReduced()) {
    animateCount(modalTotalEntries,   parseInt(modalTotalEntries.textContent, 10) || 0, { duration: 1200 });
    animateCount(modalTotalEpisodes,  parseInt(modalTotalEpisodes.textContent,10)|| 0, { duration: 1300 });
    animateCount(modalAverageRating,  parseFloat(modalAverageRating.textContent)|| 0, { duration: 1100, decimals: 2 });
    animateCount(modalAnimeDays,      parseFloat(modalAnimeDays.textContent)    || 0, { duration: 1400, decimals: 2 });
    animateCount(modalElapsedDays,    parseInt(modalElapsedDays.textContent,10) || 0, { duration: 1200 });
    animateBars(ViewStats);
  }
}


function cycleStatsMode(delta) {
  const i = STATS_MODES.indexOf(StatsMode);
  StatsMode = STATS_MODES[(i + delta + STATS_MODES.length) % STATS_MODES.length];
  renderStatsFor(StatsMode);
  if (!prefersReduced()) animateBars(ViewStats);
}

/* ---------------------------- Animations helper --------------------------- */
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function animateCount(el, endValue, { duration = 1200, decimals = 0, prefix = '', suffix = '' } = {}) {
  if (!el) return;
  if (prefersReduced()) { el.textContent = prefix + Number(endValue).toFixed(decimals) + suffix; return; }
  const startTime = performance.now(); const start = 0; const end = Number(endValue) || 0;
  el.textContent = prefix + (decimals ? start.toFixed(decimals) : start) + suffix;
  function frame(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = easeOutCubic(t);
    const curr = start + (end - start) * eased;
    el.textContent = prefix + (decimals ? curr.toFixed(decimals) : Math.round(curr)) + suffix;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
function animateBars(scope = document) {
  if (prefersReduced()) return;
  const bars = scope.querySelectorAll('.score-bar, .genre-bar, .season-bar, .format-bar');
  bars.forEach((bar, i) => {
    const target = (bar.style.width || '').match(/([\d.]+)%/);
    const pct = target ? parseFloat(target[1]) : 0;
    bar.dataset.targetWidth = pct;
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.transition = 'width 900ms cubic-bezier(.2,.7,.2,1)';
      bar.style.width = pct + '%';
    }, i * 35);
    const valEl = bar.querySelector('.bar-value');
    if (valEl) { const to = parseInt(valEl.textContent, 10) || 0; animateCount(valEl, to, { duration: 900 }); }
  });
}

/* ------------------------ Background (cover utils) ------------------------ */
(function initBackgroundUtils() {
  if (window.__bgCoverUtilsV8) return;
  window.__bgCoverUtilsV8 = true;

  window.applyDetailBackground = function (container, url, pos = {}) {
    if (!container) return;
    const clamp01 = (v) => Math.min(100, Math.max(0, v));
    const x = clamp01(pos.x ?? 50);
    const y = clamp01(pos.y ?? 50);
    const scale = Math.max(1, Math.min(3, pos.scale ?? 1));

    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

    if (!container.__bgResizeObs) {
      container.__bgResizeObs = new ResizeObserver(() => {
        const m = container.__bgMeta;
        if (m && m.url) window.applyDetailBackground(container, m.url, { ...m.pos, scale: m.scale });
      });
      container.__bgResizeObs.observe(container);
    }

    if (!url) {
      container.style.setProperty('background-image', `linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,.55))`);
      container.style.setProperty('background-repeat', 'no-repeat', 'important');
      container.style.setProperty('background-size', `100% 100%`, 'important');
      container.style.setProperty('background-position', `50% 50%`, 'important');
      container.classList.add('has-bg');
      container.__bgMeta = null;
      return;
    }

    const img = new Image();
    img.onload = () => {
      requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const imgR = img.naturalWidth / img.naturalHeight;
        const frameR = rect.width / rect.height;
        let w, h;
        if (imgR > frameR) { h = rect.height * scale; w = h * imgR; }
        else { w = rect.width * scale; h = w / imgR; }
        const W = Math.ceil(w) + 2;
        const H = Math.ceil(h) + 2;

        container.style.setProperty('background-image',
          `linear-gradient(0deg, rgba(0,0,0,.00), rgba(0,0,0,.00)), url("${url}")`);
        container.style.setProperty('background-repeat', 'no-repeat, no-repeat', 'important');
        container.style.setProperty('background-size', `100% 100%, ${W}px ${H}px`, 'important');
        container.style.setProperty('background-position', `50% 50%, ${x}% ${y}%`, 'important');
        container.classList.add('has-bg');
        container.__bgMeta = {
          frameW: rect.width, frameH: rect.height,
          imgW: img.naturalWidth, imgH: img.naturalHeight,
          w: W, h: H, scale, pos: { x, y }, url
        };
      });
    };
    img.src = url;
  };
})();






/* ------------------------------ MAL Fill (opt) ---------------------------- */
function _cleanInline(s = '') {
  s = String(s);
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  s = s.replace(/https?:\/\/\S+/g, '');
  return s.replace(/›/g, ' ').replace(/\s{2,}/g, ' ').trim();
}
function _tidyListSmart(x = '') {
  return _cleanInline(x).split(',').map(s => s.trim()).filter(Boolean).join(', ');
}



/* ---------------- MAL Fillup (clipboard → exact MAL ID, no prompts) ---------------- */
async function handleFillByMAL() {
  // Read clipboard (works on https or localhost; file:// usually blocks)
  const clip = await tryReadClipboard();
  const malId = extractMalAnimeId(clip);
  if (!malId) { alert('No valid MyAnimeList anime link found in your clipboard.'); return; }
  pendingMalId = String(malId); // keep the link for Save

  try {
    // ✅ Use worker /full so we get Jikan's separated genres + themes
    const res = await fetch(
      malApiUrl(`/api/anime/${encodeURIComponent(malId)}/full`)
    );

    if (!res.ok) throw new Error(`Worker /full error ${res.status}`);
    const payload = await res.json();

    const mal   = payload?.details || null; // MAL v2 details
    const jikan = payload?.jikan   || null; // Jikan full object (has true genres/themes)

    if (!mal?.id && !jikan?.mal_id) {
      alert('Could not load that MAL entry.');
      return;
    }

    // Season/premiered (prefer Jikan formatting)
    const premiered = (jikan?.season && jikan?.year)
      ? (String(jikan.season)[0].toUpperCase() + String(jikan.season).slice(1)) + ' ' + jikan.year
      : (jikan?.aired?.string || '');

    const normalizedSeason = __computeSeasonFromMAL(jikan || {}, premiered);

    // Title (English first)
    const title =
      (mal?.alternative_titles?.en || '').trim() ||
      (jikan?.title_english || '').trim() ||
      (mal?.title || '').trim() ||
      (jikan?.title || '').trim() ||
      (mal?.alternative_titles?.ja || '').trim() ||
      (jikan?.title_japanese || '').trim() ||
      '';

    // Type
    const rawType = jikan?.type || mal?.media_type || 'TV';
    let type = String(rawType).toUpperCase();
    if (type === 'TV_SERIES') type = 'TV';

    // ✅ Correct separation (Jikan)
    const genresCsv = Array.isArray(jikan?.genres)
      ? jikan.genres.map(g => g?.name).filter(Boolean).join(', ')
      : '';

    const themesCsv = Array.isArray(jikan?.themes)
      ? jikan.themes.map(t => t?.name).filter(Boolean).join(', ')
      : '';

    // Episodes + duration (prefer MAL seconds, fallback Jikan string)
    const episodes =
      (typeof mal?.num_episodes === 'number') ? mal.num_episodes :
      (jikan?.episodes ?? '');

    const duration =
      (typeof mal?.average_episode_duration === 'number' && mal.average_episode_duration > 0)
        ? formatDurationSeconds(mal.average_episode_duration)
        : normalizeDuration(jikan?.duration || '');

    setVal('animeTitle', title);
    setVal('animeSubtitle', type || 'TV');
    setVal('animeGenres', genresCsv);
    setVal('animeThemes', themesCsv);
    setVal('animeSeason', normalizedSeason || premiered);
    setVal('animeEpisodes', episodes ?? '');
    setVal('animeDuration', duration || '');

    // Score (prefer MAL mean)
    const score =
      (Number.isFinite(+mal?.mean) ? +mal.mean :
      (Number.isFinite(+jikan?.score) ? +jikan.score : null));

    if (score != null) setVal('malScore', score.toFixed(2));

    // Poster (prefer MAL picture)
    const poster =
      mal?.main_picture?.large ||
      mal?.main_picture?.medium ||
      jikan?.images?.jpg?.large_image_url ||
      jikan?.images?.webp?.large_image_url ||
      '';

    currentImage = poster || null;
    currentImageSource = poster ? 'mal' : currentImageSource;

    imagePreview.innerHTML = currentImage
      ? `<img src="${currentImage}" alt="Preview">`
      : '<i class="fas fa-image"></i>';

    showNotification?.('Filled from MAL (genres/themes fixed).');
  } catch (err) {
    console.error(err);
    alert('Could not fetch details for that link.');
  }

  function setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.value = value;
  }
    function normalizeDuration(s) {
    return compactDuration(s);
  }

}

// Helpers
async function tryReadClipboard() {
  try { return (await navigator.clipboard.readText() || '').trim(); }
  catch { return ''; } // blocked or denied; we’ll just warn once above
}
function extractMalAnimeId(text) {
  if (!text) return null;
  const m1 = text.match(/myanimelist\.net\/anime\/(\d+)(?:[\/?#]|$)/i);
  if (m1) return m1[1];
  const m2 = text.match(/myanimelist\.net\/anime\.php\?id=(\d+)/i);
  if (m2) return m2[1];
  return null;
}

/* ---------------- Quick MAL → Add (clipboard fetch + auto-save) ---------------- */
async function quickAddFromMALAndSave() {
  // If status is "All", this button is hidden; guard anyway.
  if (!activeStatusFilter || activeStatusFilter === 'All') return;

  // Always create a NEW entry for quick-add
  currentEditId = null;

  // Use the existing MAL clipboard flow (same as fillByMalBtn)
  await handleFillByMAL();

  // If MAL fill failed or title is empty, stop here
  const titleInput = document.getElementById('animeTitle');
  if (!titleInput || !titleInput.value.trim()) return;

  // Force status depending on current status tab (Watching / Completed / etc.)
  const statusSelect = document.getElementById('animeStatus');
  if (statusSelect) {
    statusSelect.value = activeStatusFilter;
  }

  // Submit the form programmatically so it goes through saveAnime()
  if (animeForm) {
    const ev = new Event('submit', { cancelable: true, bubbles: true });
    animeForm.dispatchEvent(ev);
  }
}

 

// ---- Season label helpers (month -> anime season) ----
function __dateToSeasonLabel(d) {
  if (!d || isNaN(d)) return null;
  const m = d.getUTCMonth();                 // 0-11
  const y = d.getUTCFullYear();
  const season = (m <= 2) ? 'Winter' : (m <= 5) ? 'Spring' : (m <= 8) ? 'Summer' : 'Fall';
  return `${season} ${y}`;
}

function __firstDateFromText(text = '') {
  // Matches: "Jan 5, 2016" OR "Jan 2016" (no day) — takes the FIRST one only
  const m = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(?:\d{1,2},\s*)?\d{4}\b/i);
  if (!m) return null;
  // Ensure a day exists so Date() parses consistently
  const fixed = m[0].replace('Sept', 'Sep').replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/i, '$1 1, $2');
  const d = new Date(fixed);
  return isNaN(d) ? null : d;
}

function __computeSeasonFromMAL(item, rawText = '') {
  // Prefer ISO if present
  const iso = item?.aired?.from;
  if (iso) {
    const d = new Date(iso);
    const lbl = __dateToSeasonLabel(d);
    if (lbl) return lbl;
  }
  // Fall back to the human "aired.string" or whatever text we already placed
  const str = item?.aired?.string || rawText || '';
  const d = __firstDateFromText(str);
  return d ? __dateToSeasonLabel(d) : null;
}



/* ---------------------------- Delete / Helpers ---------------------------- */
function deleteAnime(id) {
  const target = (animeList || []).find(a => String(a.id) === String(id));
  const malId = __getMalIdFromEntry(target);

  animeList = (animeList || []).filter(a => String(a.id) !== String(id));
  saveToLocalStorage();
  renderAnimeCards();

  // cloud remove (best-effort)
  if (__authUser && malId) cloudListRemove(malId).catch(() => {});
}
function deleteCurrentAnime() {
  if (currentEditId == null) return;
  if (!confirm('Delete this anime?')) return;
  deleteAnime(currentEditId);
  closeModals();
}

/* --------------------------- Event Wiring (UI) ---------------------------- */
function setupEventListeners() {
  // Sidebar
sidebarToggle?.addEventListener('click', openSidebar);
closeSidebar?.addEventListener('click', closeSidebarFn);

[homeFab, browseFab, listFab, statisticsFab, profileFab, accountFab, settingsFab]
  .filter(Boolean)
  .forEach(btn => btn.addEventListener('click', closeSidebarFn));

homeFab?.addEventListener('click', () => { location.hash = '#home'; });
browseFab?.addEventListener('click', () => { location.hash = '#browse'; });
listFab?.addEventListener('click', () => { location.hash = '#list'; });
statisticsFab?.addEventListener('click', () => { location.hash = '#statistics'; });

profileFab?.addEventListener('click', () => { location.hash = '#profile'; });
accountFab?.addEventListener('click', () => { location.hash = '#account'; });
settingsFab?.addEventListener('click', () => { location.hash = '#settings'; });


  settingsNav?.addEventListener('click', (e) => {
    const btn = e.target.closest('.settings-nav-item');
    if (!btn) return;
    setSettingsSection(btn.dataset.section);
  });

  // Close any modal via [data-close] OR plain .close-modal (parent modal)
document.body.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('[data-close], .close-modal');
  if (!closeBtn) return;

  const sel = closeBtn.getAttribute && closeBtn.getAttribute('data-close');
  const modal = sel ? document.querySelector(sel) : closeBtn.closest('.modal');
  if (modal) closeWithAnimation(modal);
});

  // Sidebar auth (guest vs user)
  syncAuthUI();
  window.addEventListener('storage', syncAuthUI);

  sbLogin?.addEventListener('click', () => {
    closeSidebarFn();
    location.hash = '#userlogin';
  });

  sbSignup?.addEventListener('click', () => {
    closeSidebarFn();
    location.hash = '#usersignup';
  });



// Bulk panel controls
bulkCancelBtn?.addEventListener('click', exitBulkMode);
bulkSelectAll?.addEventListener('change', (e) => selectAllVisible(e.target.checked));

bulkApplyBtn?.addEventListener('click', () => {
  const ids = [...bulkSelected];
  if (ids.length === 0) { alert('Select at least one entry first.'); return; }

  // Add to favorites (idempotent "add", not toggle)
  if (bulkFav?.checked) {
    ids.forEach(id => {
      const a = (animeList || []).find(x => String(x.id) === String(id));
      if (a) a.isFavorite = true;
    });
  }

    // Link Relations: create a NEW group for the selected entries
  // - does NOT merge/override existing groups (strict)
  // - one entry can belong to multiple groups
  if (bulkLinkRelations?.checked) {
    if (ids.length < 2) {
      alert('Select at least 2 entries to link relations.');
      return;
    }

    const now = Date.now();
    const groupId = `LR-${now}`;

    ids.forEach(id => {
      const a = (animeList || []).find(x => String(x.id) === String(id));
      if (!a) return;

      // Normalize old single-group shape -> groups[]
      const prev = a.linkRelations || {};
      let groups = [];

      if (Array.isArray(prev.groups)) {
        groups = prev.groups.slice();
      } else if (prev.groupId && Array.isArray(prev.linkedIds)) {
        groups = [{
          groupId: prev.groupId,
          linkedIds: prev.linkedIds.slice(),
          updatedAt: prev.updatedAt || now
        }];
      }

      // Add the NEW group (do not merge with existing ones)
      groups.push({
        groupId,
        linkedIds: ids.filter(otherId => String(otherId) !== String(id)),
        updatedAt: now
      });

      // Keep a flattened linkedIds for quick rendering/back-compat (union of all groups)
      const flat = groups
        .flatMap(g => Array.isArray(g.linkedIds) ? g.linkedIds : [])
        .map(x => String(x))
        .filter(x => x !== String(a.id));
      const unionLinked = [...new Set(flat)];

      a.linkRelations = {
        groups,
        linkedIds: unionLinked, // derived union (safe for current UI)
        updatedAt: now
      };
    });

    showNotification?.(`Linked relations for ${ids.length} entries`);
  }


  // Delete entries (confirm)
  if (bulkDelete?.checked) {
    if (!confirm(`Delete ${ids.length} entr${ids.length > 1 ? 'ies' : 'y'}?`)) return;
    ids.forEach(id => deleteAnime(id));
  }

  saveToLocalStorage();

  // ✅ Keep Bulk Edit open, but auto-deselect everything after applying
  bulkSelected.clear();
  if (bulkSelectAll) bulkSelectAll.checked = false;

  renderAnimeCards();  // clears the visual "bulk-selected" state
  updateBulkCount();
});






// enter Bulk Edit mode
newListFab?.addEventListener('click', enterBulkMode);

// toggle Card/List view
viewModeBtn?.addEventListener('click', () => {
  UI.viewMode = (UI.viewMode === 'list') ? 'card' : 'list';
  saveUI();
  syncViewModeBtn();
  syncListSidebarViewBtn();
  renderAnimeCards(); // routes to list renderer automatically if viewMode === 'list'
});



bulkHeaderBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  enterBulkMode();
});



// Outside-click on the backdrop should close any active modal
// Outside-click: close quick action drawer AND close any active modal backdrop
document.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;

  // 1) If quick action drawer is open, clicking outside it (and not on its toggle) closes it
  if (detailActionDrawer?.classList.contains('open')) {
    const clickedInsideDrawer = detailActionDrawer.contains(t);
    const clickedToggle = !!(detailDrawerToggle && detailDrawerToggle.contains(t));
    if (!clickedInsideDrawer && !clickedToggle) {
      closeDetailDrawer();
      // optional: return here if you don't also want the backdrop to close on the same click
      // return;
    }
  }

  // 2) Close any active modal when clicking on its backdrop
  if (t.classList.contains('modal') && t.classList.contains('active')) {
    if (t === detailModal && window.__bgLockOpen) return; // don't close while bg reposition is active
    // click is on the backdrop itself (not modal-content), so close it
    closeWithAnimation(t);
  }
});

  // Detail quick actions now use the global right-click menu.
  // Hide the legacy drawer toggle + drawer UI entirely.
  if (detailDrawerToggle) {
    detailDrawerToggle.setAttribute('aria-hidden', 'true');
    detailDrawerToggle.style.display = 'none';
  }
  if (detailActionDrawer) {
    detailActionDrawer.setAttribute('hidden', 'true');
    detailActionDrawer.setAttribute('aria-hidden', 'true');
    detailActionDrawer.setAttribute('inert', '');
    detailActionDrawer.classList.remove('open');
  }

// wire quick-action buttons (previously unbound)
editAnimeBtn?.addEventListener('click', () => {
  closeDetailDrawer();
  if (currentEditId != null) openEditModal(currentEditId);
});

rearrangeBtn?.addEventListener('click', () => {
  startRearrangeMode?.();
  closeDetailDrawer();
});

favoriteBtn?.addEventListener('click', () => {
  toggleFavorite();
});

deleteAnimeBtn?.addEventListener('click', () => {
  deleteCurrentAnime();
});


  // Status chips (replaces search box on #list)
  const setActiveStatus = (status) => {
    activeStatusFilter = status || 'All';

    // Header chips
    $$('.status-chip[data-status]').forEach(chip => {
      chip.classList.toggle(
        'active',
        (chip.dataset.status || 'All') === activeStatusFilter
      );
    });

    // Keep list sidebar buttons in sync (you already have this)
    syncListSidebarStatus?.();

    // Quick MAL-add button (hidden in "All")
    if (quickMalAddBtn) {
      quickMalAddBtn.style.display =
        (activeStatusFilter === 'All') ? 'none' : 'inline-flex';
    }
  };

  // Click any chip in the header toggle bar
  statusToggle?.addEventListener('click', (e) => {
    const chip = e.target.closest('.status-chip[data-status]');
    if (!chip) return;

    setActiveStatus(chip.dataset.status || 'All');
    renderAnimeCards();
  });

  // Keep sort working
  sortOption?.addEventListener('change', renderAnimeCards);

  // Quick MAL-add action
  quickMalAddBtn?.addEventListener('click', () => {
    quickAddFromMALAndSave();
  });

  // Initial state on load
  setActiveStatus(activeStatusFilter);

  /* --------------------------- LIST SIDEBAR (LIST PAGE ONLY) --------------------------- */
  (function initListSidebar(){
    if (!listSidebar) return;

    // Empty buttons (for now): Add / Statistics / Settings
    lsAddBtn?.addEventListener('click', () => {});
    lsStatsBtn?.addEventListener('click', () => {});
    lsSettingsBtn?.addEventListener('click', () => {});

    // Edit -> Bulk edit mode (uses your existing bulk button)
    lsBulkBtn?.addEventListener('click', () => {
      if (newListFab) newListFab.click();
      syncListSidebarBulkBtn();
    });

    // View mode (list sidebar)
    lsViewBtn?.addEventListener('click', (e) => {
      e.preventDefault();

      UI.viewMode = (UI.viewMode === 'list') ? 'card' : 'list';
      saveUI();

      // sync all view toggles (header + any sidebars)
      syncViewModeBtn();
      syncListSidebarViewBtn();

      renderAnimeCards(); // routes automatically if viewMode === 'list'
    });
  })();





  

  // ===== Grid (cards + list rows) =====
  // Clicks (existing behaviors)
  animeGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.anime-card');
    const row  = e.target.closest('.anime-row');
    const openBtn = e.target.closest('[data-open]');

    let idAttr = null;
    if (openBtn) idAttr = openBtn.getAttribute('data-open');
    else if (card) idAttr = card.getAttribute('data-id');
    else if (row)  idAttr = row.getAttribute('data-id');

    if (!idAttr) return;
    const id = /^\d+$/.test(idAttr) ? Number(idAttr) : idAttr;

    if (isBulkMode && (card || row)) {
      // In Bulk mode, clicking anywhere on the entry should select it (even on <a> title links).
      // Only ignore actual action controls (context menu/buttons).
      if (e.target.closest('.context-menu, .context-option, button')) return;

      e.preventDefault(); // stop <a> clicks from navigating / stealing the interaction
      toggleSelectCard(id);
      return;
    }


    // If clicking inside the inline context bits, ignore (right-click menu is separate)
    const option = e.target.closest('.context-option');
    if (option && card) {
      const action = option.dataset.action;
      if (action === 'edit')   openEditModal(id);
      if (action === 'delete' && confirm('Delete this anime?')) deleteAnime(id);
      return;
    }

    if (!e.target.closest('.context-menu')) openEntryDetails(id, 'list');

  });





  // NEW: Right-click context menu (cards + list rows)
  animeGrid.addEventListener('contextmenu', (e) => {
    const target = e.target.closest('.anime-card, .anime-row');
    if (!target) return;
    e.preventDefault();
    const id = target.getAttribute('data-id');
    // LIST MODE + card grid → 4 options (edit / reposition / fav / delete)
    showEntryContextMenu(id, e.clientX, e.clientY, 'list');
  });

// ===== HOME cards: same click + contextmenu behavior as animeGrid =====
homeView?.addEventListener('click', (e) => {
  const card = e.target.closest('.anime-card');
  const openBtn = e.target.closest('[data-open]');
  if (!card && !openBtn) return;

  let idAttr = null;
  if (openBtn) idAttr = openBtn.getAttribute('data-open');
  else if (card) idAttr = card.getAttribute('data-id');
  if (!idAttr) return;

  const id = /^\d+$/.test(idAttr) ? Number(idAttr) : idAttr;

  // ignore inline context options if clicked
  const option = e.target.closest('.context-option');
  if (option && card) {
    const action = option.dataset.action;
    if (action === 'edit') openEditModal(id);
    if (action === 'delete' && confirm('Delete this anime?')) deleteAnime(id);
    return;
  }

  if (!e.target.closest('.context-menu'))  openEntryDetails(id, 'home');

});

homeView?.addEventListener('contextmenu', (e) => {
  const target = e.target.closest('.anime-card');
  if (!target) return;
  e.preventDefault();
  const id = target.getAttribute('data-id');
  showEntryContextMenu(id, e.clientX, e.clientY, 'list');
});


      // Detail modal: button beside Close opens the 5 options menu
detailMenuBtn?.addEventListener('click', (e) => {
  // Prevent the global ".close-modal" click handler from closing the detail modal
  e.preventDefault();
  e.stopPropagation();

  if (!detailModal?.classList.contains('active')) return;
  if (currentEditId == null) return;

  // toggle if already open for this entry
  const menu = ensureEntryContextMenu();
  const alreadyOpen =
    menu.classList.contains('show') && String(entryCtxId) === String(currentEditId);
  if (alreadyOpen) { hideEntryContextMenu(); return; }

  const r = detailMenuBtn.getBoundingClientRect();
  const x = Math.round(r.right);
  const y = Math.round(r.bottom + 8);

  showEntryContextMenu(currentEditId, x, y, 'detail');
});




  // ===== Helpers (scoped to this setup) =====
  let entryCtxMenu = null, entryCtxId = null;

  function ensureEntryContextMenu() {
    if (entryCtxMenu) return entryCtxMenu;
    const el = document.createElement('div');
    el.className = 'context-menu global';
    el.innerHTML = `
      <button class="context-option" data-action="edit">
        <i class="fas fa-edit"></i> Edit Entry Data
      </button>
      <button class="context-option" data-action="delete">
        <i class="fas fa-trash"></i> Delete This Entry
      </button>
      <button class="context-option" data-action="reposition">
        <i class="fas fa-arrows-alt"></i> Rearrange Order
      </button>
      <button class="context-option" data-action="fav">
        <i class="fas fa-star"></i> Add to favorites
      </button>
      <button class="context-option context-option-bg" data-action="bg" style="display:none;">
        <i class="fas fa-image"></i> Edit background
      </button>
    `;
    el.addEventListener('click', onEntryContextClick);
    document.body.appendChild(el);

    // Global dismissors
    document.addEventListener('click', (ev) => {
      if (!ev.target.closest('.context-menu')) hideEntryContextMenu();
    }, true);
    window.addEventListener('resize', hideEntryContextMenu);
    window.addEventListener('scroll', hideEntryContextMenu, true);
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') hideEntryContextMenu();
    });

    entryCtxMenu = el;
    return el;
  }

  function showEntryContextMenu(id, x, y, scope = 'list') {
    const menu = ensureEntryContextMenu();
    entryCtxId = id;

    // toggle fav label if already favorited
    const a = (animeList || []).find(x => String(x.id) === String(id));
    const favBtn = menu.querySelector('[data-action="fav"]');
    if (favBtn) {
      favBtn.innerHTML = a?.isFavorite
        ? '<i class="fas fa-star"></i> Remove from favs'
        : '<i class="fas fa-star"></i> Add to favorites';
    }

    // "Edit background" is available from anywhere (list/cards/etc.)
    const bgBtn = menu.querySelector('[data-action="bg"]');
    if (bgBtn) bgBtn.style.display = 'flex';


    menu.style.left = `${x}px`;
    menu.style.top  = `${y}px`;
    menu.classList.add('show');

    // Clamp into viewport (important for top-right button + right-click edges)
    const pad = 10;
    const rect = menu.getBoundingClientRect();
    let nx = x, ny = y;

    if (rect.left < pad) nx = pad;
    if (rect.top < pad) ny = pad;
    if (rect.right > window.innerWidth - pad) nx = Math.max(pad, window.innerWidth - rect.width - pad);
    if (rect.bottom > window.innerHeight - pad) ny = Math.max(pad, window.innerHeight - rect.height - pad);

    if (nx !== x) menu.style.left = `${nx}px`;
    if (ny !== y) menu.style.top  = `${ny}px`;
  }


  function hideEntryContextMenu() {
    entryCtxMenu?.classList.remove('show');
    entryCtxId = null;
  }

  function onEntryContextClick(e) {
    const btn = e.target.closest('.context-option');
    if (!btn || !entryCtxId) return;

    const id = entryCtxId;
    hideEntryContextMenu();

    const action = btn.dataset.action;

    if (action === 'edit') {
      openEditModal(id);
      return;
    }

    if (action === 'delete') {
      if (!confirm('Delete this entry?')) return;
      const idx = animeList.findIndex(a => String(a.id) === String(id));
      if (idx !== -1) {
        animeList.splice(idx, 1);
        saveToLocalStorage();
        renderAnimeCards();
        showNotification('Entry deleted');
      }
      return;
    }

    if (action === 'reposition') {
      // Go straight into rearrange mode without flashing the detail modal
      currentEditId = id;
      startRearrangeMode?.();
      return;
    }

    if (action === 'fav') {
      const a = animeList.find(a => String(a.id) === String(id));
      if (!a) return;
      a.isFavorite = !a.isFavorite;
      saveToLocalStorage();
      renderAnimeCards();
      showNotification(a.isFavorite ? 'Added to favorites' : 'Removed from favorites');
      return;
    }

    if (action === 'bg') {
      // Open EntryDetails AND auto-open the BG dock on that page
      window.__openBgDockTargetId = String(id);
      window.__openBgDockOnEntryDetails = true;
      openEntryDetails(id);
      return;
    }


  }

  // (keep)
  window.addEventListener('resize', setupCardTitleMarquees);
  


 if (!window.__applyColsResize) { window.__applyColsResize = true; window.addEventListener('resize', () => { if (UI?.viewMode !== 'list') { try { const n = Math.max(6, Math.min(12, parseInt(UI.cardsPerRow || 10, 10))); if (window.innerWidth > 1300) { animeGrid.style.gridTemplateColumns = `repeat(${n}, 1fr)`; } else { animeGrid.style.gridTemplateColumns = ''; } } catch(_e){} } }); }

}




/* ------------------------------ UI Settings ------------------------------ */
const UI_KEY = 'aniTrack.ui';
const UI_DEFAULTS = {
  viewMode: 'card', // 'card' | 'list'
  cardsPerRow: 10,
  listColumns: {
    picture: true,
    title: true,
    type: true,
    season: true,
    status: true,
    genres: true,
    themes: true,
    episodes: true,
    duration: true,
    malScore: true,
    rating: true
  }
};
let UI = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(UI_KEY) || 'null') || {};
    // shallow merge to survive future additions
    return { ...UI_DEFAULTS, ...saved, listColumns: { ...UI_DEFAULTS.listColumns, ...(saved.listColumns||{}) } };
  } catch { return { ...UI_DEFAULTS }; }
})();
function saveUI(){ try { localStorage.setItem(UI_KEY, JSON.stringify(UI)); } catch {} }

function syncViewModeBtn(){
  if (!viewModeBtn) return;
  const isList = UI?.viewMode === 'list';

  viewModeBtn.classList.toggle('active', isList);
  viewModeBtn.innerHTML = isList
    ? '<i class="fas fa-list"></i>'
    : '<i class="fas fa-th-large"></i>';

  const tip = isList ? 'Switch to Card Grid' : 'Switch to List Grid';
  viewModeBtn.title = tip;
  viewModeBtn.setAttribute('aria-label', tip);
}

function syncListSidebarStatus(){
  if (!listSidebar) return;
  $$('.ls-btn[data-status]', listSidebar).forEach(b => {
    b.classList.toggle('active', (b.dataset.status || 'All') === activeStatusFilter);
  });
}

function syncListSidebarViewBtn(){
  if (!lsViewBtn) return;
  const isList = UI?.viewMode === 'list';
  const ico = lsViewBtn.querySelector('i');
  if (ico) ico.className = isList ? 'fas fa-list' : 'fas fa-th-large';

  lsViewBtn.classList.toggle('active', isList);

  const tip = isList ? 'Switch to Card Grid' : 'Switch to List Grid';
  lsViewBtn.title = tip;
  lsViewBtn.setAttribute('aria-label', tip);
}

function syncListSidebarBulkBtn(){
  if (!lsBulkBtn) return;
  lsBulkBtn.classList.toggle('active', !!isBulkMode);
  lsBulkBtn.setAttribute('aria-pressed', String(!!isBulkMode));
}






/* ------------------------------ Simple Routing ----------------------------- */

function renderSettingsPage(){
  if (!settingsView) return;

  // keep HTML stable (don’t re-render every time)
  if (settingsView.__built) return;
  settingsView.__built = true;

  const nav = document.getElementById('settingsPageNav');
  const content = document.getElementById('settingsPageContent');

  const setSection = (section) => {
    // highlight
    nav?.querySelectorAll('.settings-nav-item')
      .forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));

    // keep sections empty for now (placeholder only)
    if (content) {
      content.innerHTML = `<div class="settings-empty"></div>`;
    }
  };

  // click handling
  nav?.addEventListener('click', (e) => {
    const btn = e.target.closest('.settings-nav-item');
    if (!btn) return;
    setSection(btn.dataset.section);
  });

  // default selection
  setSection('personalization');
}


function renderStatisticsPage(){
  if (!statisticsView) return;
  if (!statisticsView.__built) {
    statisticsView.__built = true;
  }
}

function openEntryDetails(id, from){
  if (id == null) return;

  // If this is an external MAL entry key like "mal:12345", always open via MAL loader
  const sid = String(id);
  if (sid.startsWith('mal:')) {
    const malId = sid.slice(4);
    // keep origin for back button
    window.__entryDetailsFrom = from || window.__entryDetailsFrom || 'home';
    openEntryDetailsMAL(malId);
    return;
  }

  // Track where EntryDetails was opened from (only set when explicitly provided)
  // from: 'home' | 'list' | 'browse'
  if (from === 'home' || from === 'list' || from === 'browse') {
    window.__entryDetailsFrom = from;
  } else if (!window.__entryDetailsFrom) {
    window.__entryDetailsFrom = 'home';
  }

  window.__entryDetailsId = sid;

  const target = `#entrydetails?id=${encodeURIComponent(sid)}`;
  if (location.hash === target) {
    renderEntryDetailsPage();
  } else {
    location.hash = target;
  }
}



function renderEntryDetailsPage(){
  if (!entryDetailsView) return;

  // One-time bindings for the page
  if (!renderEntryDetailsPage.__bound){
    renderEntryDetailsPage.__bound = true;

    // Back button (no modal close)
document.getElementById('entryDetailsBackBtn')?.addEventListener('click', (e) => {
  e.preventDefault();

  const from = window.__entryDetailsFrom || 'home';
  location.hash = (from === 'list') ? '#list' : '#home';
});

    // Relations: open another entry in the same page
    entryDetailsView.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-open-entrydetails], a[data-open-relation]');
      if (!a) return;

      const rawId =
        a.getAttribute('data-open-entrydetails') ||
        a.getAttribute('data-open-relation');

      if (!rawId) return;

      e.preventDefault();

      // IMPORTANT: relations list currently stores encoded ids (e.g. mal%3A12345).
      // Decode once so openEntryDetails doesn't double-encode.
      let id = rawId;
      try { id = decodeURIComponent(rawId); } catch (_) {}

      openEntryDetails(id);
    });
  }

  // --- find id from hash ---
  const raw = location.hash || '';
  const qs = raw.includes('?') ? raw.split('?')[1] : '';
  const params = new URLSearchParams(qs);
  const id = params.get('id') || window.__entryDetailsId;
  if (!id) return;

  // Support local entries OR external MAL entries (id like "mal:12345")
  let a = null;

  if (String(id).startsWith('mal:')) {
    a = window.__entryDetailsExternal || null;
  } else {
    a = (typeof getAnimeById === 'function')
      ? getAnimeById(id)
      : (animeList || []).find(x => String(x?.id) === String(id));
  }

  if (!a) return;


  window.__entryDetailsId = String(a.id);
  currentEditId = a.id;

  // If user used right-click → "Edit background", auto-open dock here
  if (window.__openBgDockOnEntryDetails && String(window.__openBgDockTargetId) === String(a.id)) {
    window.__openBgDockOnEntryDetails = false;
    window.__openBgDockTargetId = null;
    setTimeout(() => { try { openBgDock(); } catch {} }, 0);
  }


  // --- helpers ---
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));

const pickText = (x) => {
  if (x == null) return '';
  if (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') return String(x);
  if (typeof x === 'object') {
    // common MAL/Jikan shapes: { name }, sometimes { title }, etc.
    return String(x.name ?? x.title ?? x.value ?? x.label ?? x.text ?? '');
  }
  return String(x);
};

const valOrNA = (v) => {
  if (v == null) return 'N/A';

  if (Array.isArray(v)) {
    const arr = v
      .map(pickText)
      .map(s => String(s).trim())
      .filter(Boolean);

    return arr.length ? arr.join(', ') : 'N/A';
  }

  const s = pickText(v).trim();
  return s ? s : 'N/A';
};


  const typeNorm = (t='') => {
    t = String(t||'').trim();
    if (!t) return 'N/A';
    if (/^tv$/i.test(t)) return 'TV';
    if (/^ona$/i.test(t)) return 'ONA';
    if (/^ova$/i.test(t)) return 'OVA';
    if (/tv[\s-]*special/i.test(t)) return 'Special';
    return t.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
  };

  const seasonKey = (s='') => {
    const m=/^(Winter|Spring|Summer|Fall)\s+(\d{4})$/i.exec(String(s||'').trim());
    const o={winter:0,spring:1,summer:2,fall:3}[m?.[1]?.toLowerCase()] ?? 0;
    const y=+(m?.[2]??0);
    return {o,y};
  };
  const earliestSeason = (seasons=[]) => ([...seasons]
    .map(x=>({raw:x?.season, key:seasonKey(x?.season)}))
    .sort((p,q)=>(p.key.y-q.key.y)||(p.key.o-q.key.o))[0]?.raw) || 'N/A';
  const totalEps = (seasons=[]) => {
    const n = (seasons||[]).reduce((n,s)=>n+(+s?.episodes||0),0);
    return n>0 ? String(n) : 'N/A';
  };
  const firstDuration = (seasons=[]) => (seasons?.[0]?.duration || 'N/A');

  const setText = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = valOrNA(v);
  };
  const setHTML = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html || '';
  };

  const seasons = Array.isArray(a.seasons) ? a.seasons : [];
  const s0 = seasons[0] || {};

  // --- main header ---
  const titleEl = document.getElementById('entryDetailsAnimeTitle');
  if (titleEl) {
    titleEl.hidden = false;
    titleEl.textContent = (a.title || 'Untitled');
  }

  // Subtitle line (format • genres • themes • currently airing)
  const genres = Array.isArray(a.genres) ? a.genres
    : (typeof a.genres === 'string' ? a.genres.split(',') : []);
  const themes = Array.isArray(a.themes) ? a.themes
    : (typeof a.themes === 'string' ? a.themes.split(',') : []);

  const fmt = typeNorm(s0.format || a.subtitle || a.type || '');
  const isAiring = !!(
    a.currentlyAiring || a.isAiring || a.airing === true ||
    /currently\s*airing/i.test(String(a.broadcast || ''))
  );

  const parts = [];
  if (fmt && fmt !== 'N/A') parts.push(`<span class="dm-format">${esc(fmt)}</span>`);
  const gTxt = genres.map(x=>String(x).trim()).filter(Boolean).join(', ');
  if (gTxt) parts.push(`<span class="dm-genres">${esc(gTxt)}</span>`);
  const tTxt = themes.map(x=>String(x).trim()).filter(Boolean).join(', ');
  if (tTxt) parts.push(`<span class="dm-themes">${esc(tTxt)}</span>`);
  if (isAiring) parts.push(`<span class="dm-airing">Currently Airing</span>`);

  setHTML('entryDetailsAnimeFormat', parts.join(' <span class="detail-dot">•</span> '));

  // Poster
  const imgBox = document.getElementById('entryDetailsAnimeImage');
  if (imgBox) {
    imgBox.innerHTML = a.image
      ? `<img src="${esc(a.image)}" alt="${esc(a.title || 'Anime')}">`
      : '<i class="fas fa-image"></i>';
  }

  // Synopsis
  setText('entryDetailsSynopsis', valOrNA(a.description || a.synopsis || a.summary));

  // --- EntryDetails background ---
const page = entryDetailsView.querySelector('.entrydetails-page') || entryDetailsView;

try {
  // No special EntryDetails BG anymore — keep global body intact
  document.body.removeAttribute('data-entrydetails-bg');
  document.body.style.removeProperty('--entrydetails-bg');

  page.classList.remove('has-bg');
  page.style.backgroundImage = '';
  page.removeAttribute('data-bg-blur');
  page.style.removeProperty('--default-bg-blur');

} catch (err) {
  console.warn('EntryDetails background cleanup skipped:', err);
}





      // Make subtitle visible if present (your HTML has it hidden by default)
  const subEl = document.getElementById('entryDetailsAnimeFormat');
  if (subEl) subEl.hidden = false;

  // Set helpers that can target either the entryDetails-* IDs or the legacy modal IDs
  const setTextAny = (ids, v) => {
    const list = Array.isArray(ids) ? ids : [ids];
    for (const id of list) setText(id, v);
  };
  const setHTMLAny = (ids, html) => {
    const list = Array.isArray(ids) ? ids : [ids];
    for (const id of list) setHTML(id, html);
  };

  // --- right panel: Information ---
  const mi = a.malInfo || {};

  // --- bottom stats ---
  const inferredPremiered =
    a.premieredTimeline ||
    a.premiered ||
    mi.premiered ||
    inferPremieredTimelineFromMAL(a?.__malRaw || null) ||
    earliestSeason(seasons) ||
    'N/A';

  const inferredDuration =
    a.duration ||
    mi.duration ||
    firstDuration(seasons) ||
    'N/A';

  const epsTotal = Number(totalEps(seasons) || a?.__malRaw?.num_episodes || 0);
  const typeUpper = String(a?.type || '').toUpperCase();
  const isSingleEpisode = (epsTotal === 1) || (typeUpper === 'MOVIE');

  const setStatVisibleByValueId = (valueId, visible) => {
    const v = document.getElementById(valueId);
    if (!v) return;
    const stat = v.closest('.detail-stat');
    if (stat) stat.style.display = visible ? '' : 'none';
  };

  const setStatLabelByValueId = (valueId, labelText) => {
    const v = document.getElementById(valueId);
    if (!v) return;
    const stat = v.closest('.detail-stat');
    const label = stat?.querySelector('.detail-stat-label');
    if (label) label.textContent = labelText;
  };

  const minutesFromDurationString = (s) => {
    const str = String(s || '').toLowerCase();

    // "2 hr. 10 min." / "2 hr 10 min"
    let h = 0, m = 0;

    const mh = str.match(/(\d+)\s*(h|hr|hrs|hour|hours)\b/);
    if (mh) h = parseInt(mh[1], 10);

    const mm = str.match(/(\d+)\s*(m|min|mins|minute|minutes)\b/);
    if (mm) m = parseInt(mm[1], 10);

    // "130 min"
    if (!mh && mm) return m;

    const total = h * 60 + m;
    return total > 0 ? total : null;
  };

  const formatRuntime = (mins) => {
    const n = Number(mins);
    if (!Number.isFinite(n) || n <= 0) return '';
    if (n >= 60) {
      const hh = Math.floor(n / 60);
      const mm = n % 60;
      return mm ? `${hh}h ${mm}m` : `${hh}h`;
    }
    return `${n}m`;
  };

  // Always set these
  setTextAny(['entryDetailsPremieredValue', 'detailPremieredValue'], inferredPremiered);
  setTextAny(['entryDetailsMalScoreValue',  'detailMalScoreValue' ],
    (typeof a.malScore === 'number') ? a.malScore.toFixed(2) : 'N/A'
  );

  if (isSingleEpisode) {
    // Hide Episodes tile (page + modal)
    setStatVisibleByValueId('entryDetailsEpisodesValue', false);
    setStatVisibleByValueId('detailEpisodesValue', false);

    // Change label to "Duration"
    setStatLabelByValueId('entryDetailsDurationValue', 'Duration');
    setStatLabelByValueId('detailDurationValue', 'Duration');

    // Prefer MAL seconds → nice "2h 10m"
    let mins = null;
    const sec = Number(a?.__malRaw?.average_episode_duration);
    if (Number.isFinite(sec) && sec > 0) mins = Math.round(sec / 60);
    if (!mins) mins = minutesFromDurationString(inferredDuration);

    const pretty = mins ? formatRuntime(mins) : inferredDuration;
    setTextAny(['entryDetailsDurationValue', 'detailDurationValue'], pretty || 'N/A');
  } else {
    // Show Episodes tile (page + modal)
    setStatVisibleByValueId('entryDetailsEpisodesValue', true);
    setStatVisibleByValueId('detailEpisodesValue', true);

    // Keep label for series
    setStatLabelByValueId('entryDetailsDurationValue', 'Duration (per ep.)');
    setStatLabelByValueId('detailDurationValue', 'Duration (per ep.)');

    setTextAny(['entryDetailsEpisodesValue', 'detailEpisodesValue'], epsTotal || 'N/A');
    setTextAny(['entryDetailsDurationValue', 'detailDurationValue'], inferredDuration);
  }

  setTextAny(['entryDetailsInfoJapanese',  'detailInfoJapanese' ], mi.japaneseTitle || a.japaneseTitle || a.titleJapanese || a.altTitles?.ja);
  setTextAny(['entryDetailsInfoEnglish',   'detailInfoEnglish'  ],
  mi.englishTitle || a.englishTitle || a.titleEnglish || a.altTitles?.en || a.title
);
  const rawStatus = (mi.status || a.airingStatus || a.status || '');
  setTextAny(['entryDetailsInfoStatus', 'detailInfoStatus'], prettyAiringStatus(rawStatus));
  setTextAny(['entryDetailsInfoAired',     'detailInfoAired'    ], mi.aired         || a.aired);
  setTextAny(['entryDetailsInfoBroadcast', 'detailInfoBroadcast'], mi.broadcast     || a.broadcast);
  setTextAny(['entryDetailsInfoProducers', 'detailInfoProducers'], mi.producers     || a.producers);
  setTextAny(['entryDetailsInfoLicensors', 'detailInfoLicensors'], mi.licensors     || a.licensors);
  setTextAny(['entryDetailsInfoStudios',   'detailInfoStudios'  ], mi.studios       || a.studios || a.studio);
  setTextAny(['entryDetailsInfoSource',    'detailInfoSource'   ], mi.source        || a.source);
  setTextAny(['entryDetailsInfoAgeRating', 'detailInfoAgeRating'], mi.ageRating     || a.ageRating || a.rating);

  // --- Relations (support page + legacy modal IDs) ---
  const relPanel =
    document.getElementById('entryDetailsRelationsPanel') ||
    document.getElementById('detailRelationsPanel');

  const relList =
    document.getElementById('entryDetailsRelationsList') ||
    document.getElementById('detailRelationsList');

  const linked = (a.linkRelations?.linkedIds || a.linkedIds || [])
    .map(x => String(x))
    .filter(x => x && x !== String(a.id));

  const relIds = [...new Set(linked)];

  if (relPanel) relPanel.style.display = relIds.length ? '' : 'none';

  if (relList) {
    relList.innerHTML = relIds.map(rid => {
      const b = (typeof getAnimeById === 'function')
        ? getAnimeById(rid)
        : (animeList || []).find(x => String(x?.id) === String(rid));

      const relatedMap = window.__entryDetailsExtra?.relatedById || {};
const relTitle = relatedMap[String(rid)] || '';
const name = esc(b?.title || relTitle || `#${rid}`);
      const hid = encodeURIComponent(rid);
      // store RAW id in data-attr (no double-encode problems)
      return `<li><a href="#entrydetails?id=${hid}" data-open-entrydetails="${esc(rid)}">${name}</a></li>`;
    }).join('');
  }


}


/* ----------------------------- BROWSE (MAL Live Search) ---------------------------- */

let __browseTimer = null;
let __browseSeq = 0;
let __browseAbort = null;

// ===== LOCAL "PER-USER" META DATABASE (per browser profile) =====
// Caches every entry that was:
//  - shown on browse home sections
//  - shown in search results
//  - clicked/opened from browse
// So search feels instant, and we avoid duplicates by mal_id.

const LS_BROWSE_META_KEY = 'AniTrack_BrowseMetaDB_v1';

function loadBrowseMetaDB() {
  try {
    const raw = localStorage.getItem(LS_BROWSE_META_KEY);
    const db = raw ? JSON.parse(raw) : null;
    if (!db || typeof db !== 'object') return { v: 1, updatedAt: 0, entries: {} };
    if (!db.entries || typeof db.entries !== 'object') db.entries = {};
    return db;
  } catch {
    return { v: 1, updatedAt: 0, entries: {} };
  }
}

function saveBrowseMetaDB(db) {
  try {
    db.updatedAt = Date.now();
    localStorage.setItem(LS_BROWSE_META_KEY, JSON.stringify(db));
  } catch (e) {
    // If storage is full, fail silently (app should still work).
    console.warn('BrowseMetaDB save failed:', e);
  }
}

let __browseMetaDB = loadBrowseMetaDB();

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

function getItemTitle(it) {
  return it?.title_english || it?.title || it?.title_japanese || '';
}

// Keep only the metadata we actually need for fast search + card rendering.
// (Still a lot of metadata, but not the huge /full payload.)
function compactJikanItem(it) {
  if (!it) return null;
  const malId = String(it?.mal_id || '').trim();
  if (!malId) return null;

  return {
    mal_id: Number(it.mal_id) || it.mal_id,
    title: it?.title || '',
    title_english: it?.title_english || '',
    title_japanese: it?.title_japanese || '',
    type: it?.type || '',
    episodes: it?.episodes ?? null,
    season: it?.season ?? null,
    year: it?.year ?? null,
    genres: Array.isArray(it?.genres) ? it.genres.map(g => ({ name: g?.name || '' })) : [],
    themes: Array.isArray(it?.themes) ? it.themes.map(t => ({ name: t?.name || '' })) : [],
    images: it?.images || null
  };
}

function upsertBrowseMetaItems(items, source = 'unknown') {
  if (!Array.isArray(items) || !items.length) return;

  let changed = false;

  for (const it of items) {
    const malId = String(it?.mal_id || '').trim();
    if (!malId) continue;

    const compact = compactJikanItem(it) || null;
    if (!compact) continue;

    const existing = __browseMetaDB.entries[malId];
    __browseMetaDB.entries[malId] = {
      ...existing,
      ...compact,
      _lastSeenAt: Date.now(),
      _source: source
    };

    // precompute searchable text
    const t = [
      getItemTitle(compact),
      compact?.title,
      compact?.title_english,
      compact?.title_japanese
    ].filter(Boolean).join(' | ');

    __browseMetaDB.entries[malId]._q = norm(t);

    changed = true;
  }

  if (changed) saveBrowseMetaDB(__browseMetaDB);
}

function dedupeByMalId(items) {
  const seen = new Set();
  const out = [];
  for (const it of (items || [])) {
    const id = String(it?.mal_id || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(it);
  }
  return out;
}

function browseMetaSearch(q, limit = 25) {
  const qq = norm(q);
  if (!qq || qq.length < 2) return [];

  const rows = Object.values(__browseMetaDB.entries || {})
    .filter(e => e && e._q && e._q.includes(qq))
    // most recently seen first
    .sort((a, b) => (b._lastSeenAt || 0) - (a._lastSeenAt || 0))
    .slice(0, limit);

  // Convert back to the Jikan-ish shape your render functions already expect
  return rows.map(e => ({
    mal_id: e.mal_id,
    title: e.title,
    title_english: e.title_english,
    title_japanese: e.title_japanese,
    type: e.type,
    episodes: e.episodes,
    season: e.season,
    year: e.year,
    genres: e.genres,
    themes: e.themes,
    images: e.images
  }));
}

// Browse home preload cache (network cache)
let __browseHomeCache = {
  fetchedAt: 0,
  upcoming: [],
  topAiring: [],
  mostPopular: []
};

const BROWSE_HOME_LIMIT = 15;
const BROWSE_HOME_TTL_MS = 10 * 60 * 1000; // 10 minutes


function initBrowseSearch() {
  const input = document.getElementById('browseSearchInput');
  const clear = document.getElementById('browseClearSearch');
  const shell = document.getElementById('browseResultsShell');
  if (!input || !clear || !shell) return;

  // Make cards clickable (event delegation)
  if (!initBrowseSearch.__boundClicks) {
    initBrowseSearch.__boundClicks = true;

    shell.addEventListener('click', (e) => {
      const card = e.target.closest('.browse-anime-card');
      if (!card) return;

      const malId = card.getAttribute('data-mal-id');
      if (!malId) return;

      e.preventDefault();
      openEntryDetailsMAL(malId);
    });
  }


  const setClearVisible = () => {
    clear.style.display = input.value.trim() ? 'inline-flex' : 'none';
  };

  clear.addEventListener('click', () => {
    input.value = '';
    setClearVisible();
    // If you already implemented preload sections earlier, swap this to renderBrowseHome()
    renderBrowseEmpty();
    input.focus();
  });

  input.addEventListener('input', () => {
    setClearVisible();

    const q = input.value.trim();
    if (__browseTimer) clearTimeout(__browseTimer);

    if (q.length < 2) {
      // If you already implemented preload sections earlier, swap this to renderBrowseHome()
      renderBrowseEmpty();
      return;
    }

    __browseTimer = setTimeout(() => {
      runBrowseSearch(q).catch((err) => {
        // This happens every time we abort the previous request while typing — it’s expected.
        if (err?.name === 'AbortError') return;
        console.error(err);
      });
    }, 280);
  });
}


function renderBrowsePage() {
  const input = document.getElementById('browseSearchInput');
  const clear = document.getElementById('browseClearSearch');

  if (input) input.value = '';
  if (clear) clear.style.display = 'none';

  // Preload Browse with MAL sections
  renderBrowseHome();

  // tiny delay so it focuses after view swap
  setTimeout(() => input?.focus(), 0);
}

// ---------- Browse Home (preloaded sections) ----------

function renderBrowseHomeSkeleton() {
  const shell = document.getElementById('browseResultsShell');
  if (!shell) return;

  const skel = () => `
    <div class="browse-results-grid">
      ${Array.from({ length: 8 }).map(() => `
        <div class="browse-card" style="opacity:.55; pointer-events:none;">
          <div class="browse-cover"><i class="fas fa-spinner fa-spin"></i></div>
          <div class="browse-info">
            <div class="browse-title">Loading…</div>
            <div class="browse-divider"></div>
            <div class="browse-meta">Fetching from MAL</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  shell.innerHTML = `
    <div class="home-section">
      <div class="home-section-head">
        <h2 class="home-section-title">Most Popular</h2>
      </div>
      <div class="home-section-line"></div>
      ${skel()}
    </div>

    <div class="home-section">
      <div class="home-section-head">
        <h2 class="home-section-title">Top Airing</h2>
      </div>
      <div class="home-section-line"></div>
      ${skel()}
    </div>

    <div class="home-section">
      <div class="home-section-head">
        <h2 class="home-section-title">Upcoming</h2>
      </div>
      <div class="home-section-line"></div>
      ${skel()}
    </div>
  `;
}

function renderBrowseHomeFromData({ upcoming = [], topAiring = [], mostPopular = [] } = {}) {
  const shell = document.getElementById('browseResultsShell');
  if (!shell) return;

  // dedupe per section
  upcoming     = dedupeByMalId(upcoming);
  topAiring    = dedupeByMalId(topAiring);
  mostPopular  = dedupeByMalId(mostPopular);

  // store ALL shown metadata into the local per-user DB
  upsertBrowseMetaItems(upcoming, 'home:upcoming');
  upsertBrowseMetaItems(topAiring, 'home:topairing');
  upsertBrowseMetaItems(mostPopular, 'home:mostpopular');

  const section = (title, items) => `
    <div class="home-section">
      <div class="home-section-head">
        <h2 class="home-section-title">${escapeHtml(title)}</h2>
      </div>
      <div class="home-section-line"></div>
      ${items && items.length
        ? `<div class="browse-results-grid">${(items || []).map(renderBrowseCardHTML).join('')}</div>`
        : `
          <div class="empty-state">
            <i class="fas fa-circle-xmark"></i>
            <h2>No results</h2>
            <p>Couldn’t load this section right now.</p>
          </div>
        `}
    </div>
  `;

  shell.innerHTML =
    section('Most Popular', mostPopular) +
    section('Top Airing', topAiring) +
    section('Upcoming', upcoming);
}


function renderBrowseCardHTML(it){
  const malId = it?.mal_id ?? it?.id ?? '';
  const title = (it?.title || it?.title_english || it?.title_japanese || 'Untitled').toString().trim() || 'Untitled';

  const img =
    it?.images?.webp?.large_image_url ||
    it?.images?.jpg?.large_image_url ||
    it?.images?.jpg?.image_url ||
    '';

  // Score → pill
  const s = (it?.score == null) ? '' : String(it.score).trim();
  const scoreNum = (s !== '' && Number.isFinite(+s) && (+s > 0)) ? +s : null;
  const ratingDisplay = (scoreNum != null) ? scoreNum.toFixed(2) : 'N/A';

  // Meta line like: "TV • Fall 2024"
  const rawType = String(it?.type || '').trim();
  let formatDisplay = 'N/A';
  if (rawType) {
    if (/^tv$/i.test(rawType)) formatDisplay = 'TV';
    else if (/^ona$/i.test(rawType)) formatDisplay = 'ONA';
    else if (/^ova$/i.test(rawType)) formatDisplay = 'OVA';
    else if (/tv[\s-]*special/i.test(rawType)) formatDisplay = 'Special';
    else formatDisplay = rawType.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  const premiered = String(it?.season || it?.aired?.string || '').trim() || 'N/A';
  const metaLine = `${formatDisplay} • ${premiered}`;

  return `
    <div class="anime-card browse-anime-card" data-mal-id="${malId}">
      <div class="card-image">
        ${img ? `<img src="${img}" alt="${title}">` : '<i class="fas fa-image"></i>'}
      </div>

      <div class="card-overlay">
        <div class="card-rating-pill">${ratingDisplay}</div>
        <div class="card-overlay-bottom">
          <h3 class="card-overlay-title">${title}</h3>
          <div class="card-overlay-meta">${metaLine}</div>
        </div>
      </div>
    </div>
  `;
}







async function renderBrowseHome() {
  const now = Date.now();

  // If fresh cache exists, use it instantly
  if (__browseHomeCache.fetchedAt && (now - __browseHomeCache.fetchedAt) < BROWSE_HOME_TTL_MS) {
    renderBrowseHomeFromData(__browseHomeCache);
    return;
  }

  // cancel any previous browse request (search/home share the same abort)
  try { __browseAbort?.abort(); } catch {}
  __browseAbort = new AbortController();

  renderBrowseHomeSkeleton();

  try {
    const [upcoming, topAiring, mostPopular] = await Promise.all([
      jikanFetchUpcoming({ limit: BROWSE_HOME_LIMIT, signal: __browseAbort.signal }),
      jikanFetchTopAiring({ limit: BROWSE_HOME_LIMIT, signal: __browseAbort.signal }),
      jikanFetchMostPopular({ limit: BROWSE_HOME_LIMIT, signal: __browseAbort.signal })
    ]);

    __browseHomeCache = {
      fetchedAt: Date.now(),
      upcoming: Array.isArray(upcoming) ? upcoming : [],
      topAiring: Array.isArray(topAiring) ? topAiring : [],
      mostPopular: Array.isArray(mostPopular) ? mostPopular : []
    };

    // If user started a search since we began, don't overwrite it
    const input = document.getElementById('browseSearchInput');
    if (input && input.value.trim().length >= 2) return;

    renderBrowseHomeFromData(__browseHomeCache);
  } catch (err) {
    if (err?.name === 'AbortError') return;
    console.error(err);

    // fallback to the old empty message if something goes wrong
    renderBrowseEmpty();
  }
}

function malNodeToJikanLike(node) {
  if (!node) return null;

  const pic = node?.main_picture || null;
  const img = pic?.large || pic?.medium || '';

  const season = node?.start_season?.season || '';
  const year = node?.start_season?.year || '';
  const seasonStr = (season && year)
    ? `${season[0].toUpperCase()}${season.slice(1)} ${year}`
    : '';

  return {
    mal_id: node?.id,
    title: node?.title || '',
    title_english: node?.alternative_titles?.en || '',
    title_japanese: node?.alternative_titles?.ja || '',
    type: node?.media_type || '',
    episodes: node?.num_episodes ?? null,
    season: seasonStr,
    year: year || null,
    genres: Array.isArray(node?.genres) ? node.genres.map(g => ({ name: g?.name || '' })) : [],
    themes: [],

    // MAL score lives in "mean" when requested via fields=mean
    score: node?.mean ?? node?.mean_score ?? node?.score ?? null,

    images: img
      ? {
          jpg: { large_image_url: img, image_url: img },
          webp: { large_image_url: img, image_url: img }
        }
      : null
  };
}

async function jikanFetchList(url, { signal } = {}) {
  // kept name so your existing calls don't change
  const res = await fetch(url, { signal });

  if (res.status === 429) {
    const err = new Error('Rate limited by MAL API (429).');
    err._rateLimitHit = true;
    throw err;
  }
  if (!res.ok) throw new Error(`MAL list failed: ${res.status}`);

  const json = await res.json();
  const arr = Array.isArray(json?.data) ? json.data : [];

  // Worker returns MAL ranking/search format: [{ node: {...} }, ...]
  return arr.map(x => malNodeToJikanLike(x?.node || x)).filter(Boolean);
}

async function jikanFetchUpcoming({ limit = 12, signal } = {}) {
  const url = malApiUrl(
    `/api/ranking?type=upcoming&limit=${encodeURIComponent(limit)}&fields=mean,media_type,start_season,num_episodes,genres,alternative_titles`
  );
  return jikanFetchList(url, { signal });
}

async function jikanFetchTopAiring({ limit = 12, signal } = {}) {
  const url = malApiUrl(
    `/api/ranking?type=airing&limit=${encodeURIComponent(limit)}&fields=mean,media_type,start_season,num_episodes,genres,alternative_titles`
  );
  return jikanFetchList(url, { signal });
}

async function jikanFetchMostPopular({ limit = 12, signal } = {}) {
  const url = malApiUrl(
    `/api/ranking?type=bypopularity&limit=${encodeURIComponent(limit)}&fields=mean,media_type,start_season,num_episodes,genres,alternative_titles`
  );
  return jikanFetchList(url, { signal });
}

async function jikanFetchTopAll({ limit = 12, signal } = {}) {
  const url = malApiUrl(
    `/api/ranking?type=all&limit=${encodeURIComponent(limit)}&fields=mean,media_type,start_season,num_episodes,genres,alternative_titles`
  );
  return jikanFetchList(url, { signal });
}

async function jikanFetchTopAll({ limit = 12, signal } = {}) {
  const url = malApiUrl(
    `/api/ranking?type=all&limit=${encodeURIComponent(limit)}&fields=mean,media_type,start_season,num_episodes,genres,alternative_titles`
  );
  return jikanFetchList(url, { signal });
}



function renderBrowseEmpty() {
  const shell = document.getElementById('browseResultsShell');
  if (!shell) return;

  shell.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-search"></i>
      <h2>Search MyAnimeList</h2>
      <p>Type a title to start browsing.</p>
    </div>
  `;
}

function renderBrowseLoading(q) {
  const shell = document.getElementById('browseResultsShell');
  if (!shell) return;

  shell.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-spinner fa-spin"></i>
      <h2>Searching…</h2>
      <p>${escapeHtml(q)}</p>
    </div>
  `;
}

function renderBrowseNoResults(q) {
  const shell = document.getElementById('browseResultsShell');
  if (!shell) return;

  shell.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-circle-xmark"></i>
      <h2>No results</h2>
      <p>Try a different title.</p>
    </div>
  `;
}

/* ------------------------ Browse search: title matching ---------------------- */
function __normSearchText(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')     // strip accents
    .replace(/[^a-z0-9\s]/g, ' ')        // punctuation -> space
    .replace(/\s+/g, ' ')
    .trim();
}

function __collectAllTitles(it) {
  const titles = [
    it?.title,
    it?.title_english,
    it?.title_japanese
  ].filter(Boolean);

  // (If later you add other title arrays, you can push them here too.)
  return titles;
}

function __matchesAnyTitle(it, q) {
  const qq = __normSearchText(q);
  if (!qq) return false;

  const hay = __collectAllTitles(it).map(__normSearchText).filter(Boolean);
  if (!hay.length) return false;

  // allow partial match, token match
  if (hay.some(t => t.includes(qq))) return true;

  const parts = qq.split(' ').filter(Boolean);
  if (!parts.length) return false;

  // all tokens should exist somewhere across any title
  return parts.every(p => hay.some(t => t.includes(p)));
}

/* ------------------------- Public Jikan fallback search ---------------------- */
async function jikanPublicSearchAnime(q, { limit = 25, signal } = {}) {
  const url =
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}&sfw=true`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Jikan search failed: ${res.status}`);

  const json = await res.json();
  const arr = Array.isArray(json?.data) ? json.data : [];

  // Map Jikan objects to the same "Jikan-ish" shape your renderer expects
  return arr.map(d => ({
    mal_id: d?.mal_id,
    title: d?.title || '',
    title_english: d?.title_english || '',
    title_japanese: d?.title_japanese || '',
    type: d?.type || '',
    episodes: d?.episodes ?? null,
    season: d?.season ? `${String(d.season).replace(/^\w/, c => c.toUpperCase())} ${d?.year || ''}`.trim() : '',
    year: d?.year ?? null,
    genres: Array.isArray(d?.genres) ? d.genres.map(g => ({ name: g?.name || '' })) : [],
    themes: Array.isArray(d?.themes) ? d.themes.map(t => ({ name: t?.name || '' })) : [],
    score: d?.score ?? null,
    images: d?.images || null
  })).filter(Boolean);
}

/* -------------------- Results renderer: "Most popular area" ------------------ */
function renderBrowseResults(items, q) {
  const shell = document.getElementById('browseResultsShell');
  if (!shell) return;

  // dedupe + strict match against any title (main/en/jp)
  items = dedupeByMalId(items).filter(it => __matchesAnyTitle(it, q));

  if (!items.length) {
    renderBrowseNoResults(q);
    return;
  }

  // store into local meta DB (future searches feel instant)
  upsertBrowseMetaItems(items, 'search');

  // ✅ show results inside the same "Most Popular area" section style
  shell.innerHTML = `
    <div class="home-section">
      <div class="home-section-head">
        <h2 class="home-section-title">${escapeHtml(`Results for "${q}"`)}</h2>
      </div>
      <div class="home-section-line"></div>
      <div class="browse-results-grid">
        ${(items || []).map(renderBrowseCardHTML).join('')}
      </div>
    </div>
  `;
}

async function runBrowseSearch(q) {
  const shell = document.getElementById('browseResultsShell');
  if (!shell) return;

  try { __browseAbort?.abort(); } catch {}
  __browseAbort = new AbortController();

  const seq = ++__browseSeq;
  renderBrowseLoading(q);

  try {
    // 1) Primary: your MAL worker search
    const url = malApiUrl(
      `/api/search?q=${encodeURIComponent(q)}&limit=25&fields=mean,media_type,start_season,num_episodes,genres,alternative_titles`
    );
    const res = await fetch(url, { signal: __browseAbort.signal });

    if (seq !== __browseSeq) return;
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);

    const json = await res.json();
    const raw = Array.isArray(json?.data) ? json.data : [];

    let items = raw
      .map(x => malNodeToJikanLike(x?.node || x))
      .filter(Boolean);

    // 2) Fallback: if MAL returns nothing (or very few), use Jikan public search too
    if (items.length < 4) {
      try {
        const jikanItems = await jikanPublicSearchAnime(q, { limit: 25, signal: __browseAbort.signal });
        items = dedupeByMalId([...(items || []), ...(jikanItems || [])]);
      } catch (e) {
        // ignore fallback errors; still show MAL results if any
        console.warn('Jikan fallback failed:', e);
      }
    }

    if (seq !== __browseSeq) return;

    if (!items.length) {
      renderBrowseNoResults(q);
      return;
    }

    renderBrowseResults(items, q);
  } catch (err) {
    if (err?.name === 'AbortError') return;
    console.error(err);
    renderBrowseNoResults(q);
  }
}




function mapMalToEntryDetailsModel(d) {
  if (!d) return null;

  // ---- helpers (kept local so you don’t need to hunt other parts of the file) ----
  const monthName = (m) => ([
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ][m] || '');

  const ordinal = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return '';
    const mod100 = x % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${x}th`;
    const mod10 = x % 10;
    if (mod10 === 1) return `${x}st`;
    if (mod10 === 2) return `${x}nd`;
    if (mod10 === 3) return `${x}rd`;
    return `${x}th`;
  };

  const formatPrettyDate = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return String(iso); // fallback if MAL gives weird strings
    const day = ordinal(dt.getUTCDate());
    const mon = monthName(dt.getUTCMonth());
    const year = dt.getUTCFullYear();
    return `${day} ${mon}, ${year}`;
  };

  const formatPrettyDateRange = (startIso, endIso) => {
    const a = formatPrettyDate(startIso);
    const b = formatPrettyDate(endIso);
    if (a && b) return a === b ? a : `${a} to ${b}`;
    return a || b || '';
  };

  const capFirst = (s) => String(s || '').replace(/^\w/, c => c.toUpperCase());

  const formatBroadcastMAL = (b) => {
    if (!b) return '';
    // MAL v2 usually returns: { day_of_week: "sunday", start_time: "17:00" }
    if (typeof b === 'object') {
      const day = b.day_of_week ? capFirst(String(b.day_of_week).toLowerCase()) : '';
      const time = b.start_time ? String(b.start_time) : '';
      const tz = b.timezone ? String(b.timezone) : '';
      const out = [day, time && `at ${time}`, tz && `(${tz})`].filter(Boolean).join(' ');
      return out || '';
    }
    if (typeof b === 'string') return b;
    return '';
  };

  const prettyRating = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return '';
    const map = {
      g: 'G',
      pg: 'PG',
      pg_13: 'PG-13',
      r: 'R',
      r_plus: 'R+',
      rx: 'Rx'
    };
    const k = s.toLowerCase();
    if (map[k]) return map[k];
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // ---- data extraction ----
  const img = d?.main_picture?.large || d?.main_picture?.medium || '';

  const genres = Array.isArray(d?.genres) ? d.genres.map(g => g?.name).filter(Boolean) : [];
  const studios = Array.isArray(d?.studios) ? d.studios.map(s => s?.name).filter(Boolean) : [];

  const premiered = inferPremieredTimelineFromMAL(d);

  const durationStr =
    formatDurationSeconds(d?.average_episode_duration) ||
    (d?.episode_duration ? formatDurationSeconds(d.episode_duration) : '') ||
    (typeof d?.duration === 'string' ? d.duration : '') ||
    '';

  const airedTxt = formatPrettyDateRange(d?.start_date, d?.end_date);

  const broadcastStr = formatBroadcastMAL(d?.broadcast);

  const producersStr =
    Array.isArray(d?.producers) ? d.producers.map(x => x?.name).filter(Boolean).join(', ') : '';

  const licensorsStr =
    Array.isArray(d?.licensors) ? d.licensors.map(x => x?.name).filter(Boolean).join(', ') : '';

  const sourceStr = String(d?.source || '');
  const ratingStr = prettyRating(d?.rating);

  const rawStatus = d?.status || '';

  return {
    id: `mal:${String(d?.id || '')}`,

    title: d?.alternative_titles?.en || d?.title || d?.alternative_titles?.ja || 'Untitled',
    image: img,
    description: d?.synopsis || '',

    type: (d?.media_type || '').toUpperCase(),
    genres,
    themes: [],

malScore: (Number.isFinite(+(d?.mean ?? d?.score ?? d?.mean_score))) ? +(d?.mean ?? d?.score ?? d?.mean_score) : null,
premieredTimeline: premiered || '',
duration: durationStr || '',
aired: airedTxt,



    // ✅ sidebar fields (EntryDetails reads these)
   malInfo: {
  japaneseTitle: d?.alternative_titles?.ja || '',
  englishTitle: d?.alternative_titles?.en || '',
  premiered: premiered || '',
  duration: durationStr || '',
  status: prettyAiringStatus(rawStatus),
  aired: airedTxt,
  broadcast: broadcastStr || 'N/A',
  producers: producersStr || 'N/A',
  licensors: licensorsStr || 'N/A',
  studios: studios.join(', ') || 'N/A',
  source: sourceStr || 'N/A',
  ageRating: ratingStr || 'N/A'
},


    // ✅ stats row reads seasons[0].*
    seasons: [{
      season: premiered || '',
      episodes: (typeof d?.num_episodes === 'number') ? d.num_episodes : 0,
      duration: durationStr || '',
      format: (d?.media_type || '').toUpperCase()
    }],

    currentlyAiring: String(rawStatus).toLowerCase() === 'currently_airing'
  };
}




async function openEntryDetailsMAL(malId) {
  if (!malId) return;

  // Abort any previous details load
  try { window.__browseAbort?.abort(); } catch {}
  window.__browseAbort = new AbortController();

  // Keep origin set by openEntryDetails(id, from)
  window.__entryDetailsFrom = window.__entryDetailsFrom || 'home';

  const entryId = `mal:${String(malId)}`;
  window.__entryDetailsId = entryId;
  window.__entryDetailsExternal = null;

  // Navigate immediately (fast UI), then populate
  location.hash = `#entrydetails?id=${encodeURIComponent(entryId)}`;

  // ---------- helpers ----------
  const clean = (v) => String(v ?? '').trim();

  const joinNames = (arr) => {
    if (!Array.isArray(arr)) return '';
    const names = arr.map(x => clean(x?.name)).filter(Boolean);
    return names.length ? names.join(', ') : '';
  };

  const titleCase = (s) =>
    clean(s)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());

  const fmtDate = (isoLike) => {
    const s = clean(isoLike);
    if (!s) return '';
    const iso = s.slice(0, 10);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return '';
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (!Number.isFinite(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const airedText = (mal, jikan) => {
    // ✅ Prefer Jikan’s nice string: "Jan 9, 2020 to Jun 25, 2020"
    const js = clean(jikan?.aired?.string);
    if (js) return js;

    const from = fmtDate(mal?.start_date || jikan?.aired?.from);
    const to   = fmtDate(mal?.end_date   || jikan?.aired?.to);

    if (from && to) return `${from} to ${to}`;
    return from || to || '';
  };

  const broadcastText = (mal, jikan) => {
    // ✅ Prefer Jikan broadcast.string: "Thursdays at 01:05 (JST)"
    const js = clean(jikan?.broadcast?.string);
    if (js) return js;

    const b = mal?.broadcast;
    if (!b) return '';
    if (typeof b === 'string') return clean(b);
    if (b?.string) return clean(b.string);

    const day = clean(b?.day_of_week || b?.day || '');
    const time = clean(b?.start_time || b?.time || '');
    if (day && time) return `${titleCase(day)} at ${time}`;
    return day || time || '';
  };

  const ageRatingText = (malRating, jikanRating) => {
    // ✅ Prefer Jikan rating full label
    const jr = clean(jikanRating);
    if (jr) return jr;

    // MAL codes -> nice text
    const mr = clean(malRating).toLowerCase();
    if (!mr) return '';
    const map = {
      g: 'G - All Ages',
      pg: 'PG - Children',
      pg_13: 'PG-13 - Teens 13 or older',
      r: 'R - 17+ (violence & profanity)',
      r_plus: 'R+ - Mild Nudity',
      rx: 'Rx - Hentai'
    };
    return map[mr] || mr.replace(/_/g, '-').toUpperCase();
  };

  const durationText = (mal, jikan) => {
    // Prefer MAL seconds -> "24 min"
    const sec = Number(mal?.average_episode_duration);
    if (Number.isFinite(sec) && sec > 0) {
      const mins = Math.round(sec / 60);
      if (mins > 0) return `${mins} min`;
    }
    // fallback Jikan "24 min per ep"
    return clean(jikan?.duration) || '';
  };

  const inferPremiered = (mal, jikan) => {
    if (mal?.start_season?.season && mal?.start_season?.year) {
      const seasonRaw = clean(mal.start_season.season).toLowerCase();
      const map = { winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall', autumn: 'Fall' };
      const season = map[seasonRaw] || (seasonRaw ? seasonRaw[0].toUpperCase() + seasonRaw.slice(1) : '');
      return season ? `${season} ${mal.start_season.year}` : '';
    }
    const js = clean(jikan?.season);
    const jy = jikan?.year;
    if (js && jy) return `${js[0].toUpperCase() + js.slice(1)} ${jy}`;
    return '';
  };

  // ---------- fetch ----------
  try {
    const res = await fetch(
      malApiUrl(`/api/anime/${encodeURIComponent(malId)}/full`),
      { signal: window.__browseAbort.signal }
    );
    if (!res.ok) throw new Error(`Worker /full failed: ${res.status}`);

    const payload = await res.json();

    // Worker returns { ok:true, details, jikan, ... }
    const mal = payload?.details || null;
    const jikan = payload?.jikan || null;

    if (!mal?.id) throw new Error('Missing payload.details');

    // ✅ Titles: English first; Japanese should prefer Jikan (avoids “JP + EN mashed”)
    const titleEN =
      clean(mal?.alternative_titles?.en) ||
      clean(jikan?.title_english) ||
      clean(mal?.title) ||
      clean(jikan?.title) ||
      clean(mal?.alternative_titles?.ja) ||
      'Untitled';

    const titleJA =
      clean(jikan?.title_japanese) ||
      clean(mal?.alternative_titles?.ja) ||
      '';

    // ✅ Prefer Jikan for these human-readable fields
    const aired      = airedText(mal, jikan);
    const broadcast  = broadcastText(mal, jikan);
    const producers  = joinNames(jikan?.producers) || joinNames(mal?.producers) || '';
    const licensors  = joinNames(jikan?.licensors) || joinNames(mal?.licensors) || '';
    const studios    = joinNames(jikan?.studios)   || joinNames(mal?.studios)   || '';
    const source     = clean(jikan?.source) ? titleCase(jikan.source) : titleCase(mal?.source);
    const ageRating  = ageRatingText(mal?.rating, jikan?.rating);

    const premiered  = inferPremiered(mal, jikan);
    const duration   = durationText(mal, jikan);

    // ---------- relations ----------
    const relatedById = {};
    const relatedIds = [];
    const addRel = (rawId, title) => {
      const idNum = Number(rawId);
      if (!Number.isFinite(idNum) || idNum <= 0) return;
      const rid = `mal:${idNum}`;
      if (rid === entryId) return;
      const t = clean(title);
      if (t && !relatedById[rid]) relatedById[rid] = t;
      relatedIds.push(rid);
    };

    (mal?.related_anime || []).forEach(r => addRel(r?.node?.id, r?.node?.title));

    (payload?.relations || []).forEach(group => {
      (group?.entry || []).forEach(e => {
        const type = clean(e?.type).toLowerCase();
        if (type && type !== 'anime') return;
        addRel(e?.mal_id, e?.name || e?.title);
      });
    });

    const uniqueRelatedIds = [...new Set(relatedIds)];

    // ---------- store extras globally ----------
    window.__entryDetailsExtra = {
      jikan,
      characters: payload?.characters ?? null,
      staff: payload?.staff ?? null,
      external_links: payload?.external_links ?? null,
      relations: payload?.relations ?? null,
      streaming: payload?.streaming ?? null,
      themes: payload?.themes ?? null,
      videos: payload?.videos ?? null,
      pictures: payload?.pictures ?? null,

      recommendations: payload?.recommendations ?? null,
      statistics: payload?.statistics ?? null,
      related_anime: payload?.related_anime ?? mal?.related_anime ?? null,
      related_manga: payload?.related_manga ?? mal?.related_manga ?? null,

      relatedById
    };

    // ---------- object EntryDetails renderer expects ----------
    const mapped = {
      id: entryId,
      title: titleEN,
      image: mal?.main_picture?.large || mal?.main_picture?.medium || '',
      description: mal?.synopsis || '',

      type: clean(mal?.media_type).toUpperCase(),
      // ✅ Prefer Jikan (true separated genres/themes). MAL's genres include themes too.
      genres: Array.isArray(jikan?.genres)
        ? jikan.genres.map(g => g?.name).filter(Boolean)
        : (Array.isArray(mal?.genres) ? mal.genres.map(g => g?.name).filter(Boolean) : []),

      themes: Array.isArray(jikan?.themes)
        ? jikan.themes.map(t => t?.name).filter(Boolean)
        : [],

      malScore: (Number.isFinite(+(mal?.mean ?? mal?.score))) ? +(mal?.mean ?? mal?.score) : null,

      premieredTimeline: premiered,
      duration: duration,
      aired: aired,

      malInfo: {
        japaneseTitle: titleJA,
        englishTitle: titleEN,          // ✅ ensures English field always has something
        premiered: premiered,
        duration: duration,
        status: clean(mal?.status || ''), // keep raw code; render uses prettyAiringStatus()
        aired: aired,
        broadcast: broadcast,
        producers: producers,
        licensors: licensors,
        studios: studios,
        source: source,
        ageRating: ageRating
      },

      seasons: [{
        season: premiered,
        episodes: (typeof mal?.num_episodes === 'number') ? mal.num_episodes : (Number(jikan?.episodes) || 0),
        duration: duration,
        format: clean(mal?.media_type).toUpperCase()
      }],

      currentlyAiring: clean(mal?.status).toLowerCase() === 'currently_airing',
      linkRelations: uniqueRelatedIds.length ? { linkedIds: uniqueRelatedIds } : undefined,
      __malRaw: mal
    };

    // Only render if we’re still on the same entry
    const rawHash = location.hash || '';
    const qs = rawHash.includes('?') ? rawHash.split('?')[1] : '';
    const params = new URLSearchParams(qs);
    const currentId = params.get('id');

    if (String(currentId) === String(entryId)) {
      window.__entryDetailsExternal = mapped;
      if (typeof renderEntryDetailsPage === 'function') renderEntryDetailsPage();
    }
  } catch (err) {
    if (err?.name === 'AbortError') return;
    console.error('[AniTrack] openEntryDetailsMAL failed:', err);
  }
}


function mapMALToEntryDetails(d) {
  if (!d) return null;

  const join = (arr) => Array.isArray(arr) ? arr.map(x => x?.name).filter(Boolean).join(', ') : '';

  const duration =
    d?.average_episode_duration
      ? `${Math.round(d.average_episode_duration / 60)} min`
      : '';

  const broadcast =
    typeof d?.broadcast === 'string'
      ? d.broadcast
      : d?.broadcast?.day_of_week
        ? `${d.broadcast.day_of_week} at ${d.broadcast.start_time || ''}`.trim()
        : '';

  return {
    id: `mal:${d.id}`,
    title: d?.alternative_titles?.en || d?.title || d?.alternative_titles?.ja,
    image: d?.main_picture?.large || d?.main_picture?.medium || '',
    description: d?.synopsis || '',
    type: (d?.media_type || '').toUpperCase(),
    genres: Array.isArray(d?.genres) ? d.genres.map(g => g.name) : [],
    malScore: d?.mean ?? null,
    duration,
    aired: d?.start_date || '',
    malInfo: {
      status: d?.status || '',
      broadcast,
      producers: join(d?.producers),
      licensors: join(d?.licensors),
      studios: join(d?.studios),
      source: d?.source || '',
      ageRating: d?.rating || ''
    },
    seasons: [{
      episodes: d?.num_episodes || 0,
      duration
    }]
  };
}



// ============================
// MAL-only EntryDetails Loader
// ============================
function _cleanLabel(s) {
  s = String(s || '').trim();
  if (!s) return '';
  return s.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function _statusLabel(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  if (s === 'not_yet_aired' || s === 'not_aired_yet') return 'Not aired yet';
  if (s === 'currently_airing') return 'Currently airing';
  if (s === 'finished_airing') return 'Finished airing';
  return _cleanLabel(s);
}

function _minsFromSeconds(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return '';
  const mins = Math.round(n / 60);
  return mins ? `${mins} min` : '';
}

function _formatBroadcast(b) {
  if (!b) return '';
  // MAL may return broadcast as object {day_of_week, start_time} OR as a string (depending on your worker)
  if (typeof b === 'string') return b.trim();
  const day = b.day_of_week ? _cleanLabel(b.day_of_week) : '';
  const time = b.start_time ? String(b.start_time).trim() : '';
  if (day && time) return `${day}s at ${time}`;
  if (day) return `${day}s`;
  return '';
}

function _inferPremiered(d) {
  // Prefer MAL start_season if present
  if (d?.start_season?.season && d?.start_season?.year) {
    return `${_cleanLabel(d.start_season.season)} ${d.start_season.year}`;
  }
  // Fallback: infer from start_date month
  const iso = String(d?.start_date || '').slice(0, 10);
  const m = iso.match(/^(\d{4})-(\d{2})-/);
  if (!m) return '';
  const year = Number(m[1]);
  const month = Number(m[2]);
  let season = 'Winter';
  if (month >= 4 && month <= 6) season = 'Spring';
  else if (month >= 7 && month <= 9) season = 'Summer';
  else if (month >= 10 && month <= 12) season = 'Fall';
  return `${season} ${year}`;
}

// MAL v2 fetch (expects your malApiUrl worker to proxy MAL)
async function fetchAnimeById(malId, { signal } = {}) {
  const fields = [
    'id','title','main_picture','alternative_titles','synopsis',
    'mean','media_type','status',
    'start_date','end_date','start_season',
    'num_episodes','average_episode_duration',
    'broadcast','studios','genres',
    'producers','licensors',
    'source','rating'
  ].join(',');

  const url = malApiUrl(`/api/anime/${encodeURIComponent(malId)}?fields=${encodeURIComponent(fields)}`);
  const res = await fetch(url, { signal });

  if (!res.ok) throw new Error(`MAL details failed: ${res.status}`);
  const json = await res.json();
  return json?.data || null;
}

// Replace your mapper with a MAL-only mapper that actually populates the fields.
function mapMalToEntryDetailsModel(d) {
  if (!d) return null;

  const img = d?.main_picture?.large || d?.main_picture?.medium || '';

  const genres = Array.isArray(d?.genres) ? d.genres.map(g => g?.name).filter(Boolean) : [];
  const studiosArr = Array.isArray(d?.studios) ? d.studios.map(s => s?.name).filter(Boolean) : [];
  const studios = studiosArr.join(', ');

  const airedTxt =
    (d?.start_date || d?.end_date)
      ? `${d?.start_date || ''}${d?.end_date ? ` to ${d.end_date}` : ''}`.trim()
      : '';

  const premiered = _inferPremiered(d);

  const duration = _minsFromSeconds(d?.average_episode_duration) || '';

  const broadcast =
    _formatBroadcast(d?.broadcast) ||
    (typeof d?.broadcast?.string === 'string' ? d.broadcast.string : '') ||
    '';

  const joinNames = (arr) => {
    if (!Array.isArray(arr)) return '';
    return arr
      .map(x => x?.name || x?.node?.name || x?.title || '')
      .map(s => String(s).trim())
      .filter(Boolean)
      .join(', ');
  };

  const producers = joinNames(d?.producers);
  const licensors = joinNames(d?.licensors);

  const source = String(d?.source || '').trim();
  const rating = String(d?.rating || '').trim();

  const statusLabel = _statusLabel(d?.status);

  return {
    id: `mal:${String(d?.id || '')}`,

    title: d?.alternative_titles?.en || d?.title || d?.alternative_titles?.ja || 'Untitled',
    image: img,
    description: d?.synopsis || '',

    type: (d?.media_type || '').toUpperCase(),
    genres,
    themes: [],

    premieredTimeline: premiered,
    malScore: (Number.isFinite(+(d?.mean ?? d?.score ?? d?.mean_score))) ? +(d?.mean ?? d?.score ?? d?.mean_score) : null,
    duration,
    aired: airedTxt,

    malInfo: {
      japaneseTitle: d?.alternative_titles?.ja || '',
      englishTitle: d?.alternative_titles?.en || '',
      status: statusLabel,
      aired: airedTxt,
      broadcast,
      producers,
      licensors,
      studios,
      source,
      ageRating: rating,
      duration
    },

    seasons: [{
      season: premiered,
      episodes: (typeof d?.num_episodes === 'number') ? d.num_episodes : 0,
      duration,
      format: (d?.media_type || '').toUpperCase()
    }],

    currentlyAiring: String(d?.status || '').toLowerCase() === 'currently_airing'
  };
}


// Spotlight: Show Details -> always go to #entrydetails with correct data
spotlightDetailBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  const id = __spotlightIds?.[__spotlightIndex];
  if (!id) return;
  openEntryDetails(id, 'home'); // openEntryDetails now routes mal: correctly too
});

// Spotlight prev/next
spotlightNextBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!__spotlightIds?.length) return;
  __spotlightIndex = (__spotlightIndex + 1) % __spotlightIds.length;
  updateSpotlightUI({}, { direction: 'left' });
});

spotlightPrevBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!__spotlightIds?.length) return;
  __spotlightIndex = (__spotlightIndex - 1 + __spotlightIds.length) % __spotlightIds.length;
  updateSpotlightUI({}, { direction: 'right' });
});


// small safe helper
function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* ----------------------------- ROUTING ---------------------------- */

function applyRoute(){

  // default: Home
  if (!location.hash) location.hash = '#home';

  // normalize & support hashes that might include extra stuff later
  const raw = (location.hash || '#home').toLowerCase();
  const route = raw.split('?')[0];

  const isHome         = route === '#home';
  const isList         = route === '#list';
  const isBrowse       = route === '#browse';
  const isSettings     = route === '#settings';
  const isStatistics   = route === '#statistics';
  const isEntryDetails = route === '#entrydetails';

  // NEW routes
  const isUserSignup   = route === '#usersignup';
  const isUserLogin    = route === '#userlogin';
  const isAccount      = route === '#account';
  const isProfile      = route === '#profile';

  // If unknown route → go home (prevents blank page)
  const known =
    isHome || isList || isBrowse || isSettings || isStatistics || isEntryDetails ||
    isUserSignup || isUserLogin || isAccount || isProfile;

  if (!known) {
    location.hash = '#home';
    return;
  }

  // Require login for Account/Profile
  if ((isAccount || isProfile) && !isUserLoggedIn()) {
    location.hash = '#userlogin';
    return;
  }

  // If already logged in, prevent opening auth pages
  if ((isUserSignup || isUserLogin) && isUserLoggedIn()) {
    location.hash = '#account';
    return;
  }

  // views
  if (homeView)          homeView.hidden          = !isHome;
  if (listView)          listView.hidden          = !isList;
  if (browseView)        browseView.hidden        = !isBrowse;
  if (settingsView)      settingsView.hidden      = !isSettings;
  if (statisticsView)    statisticsView.hidden    = !isStatistics;
  if (entryDetailsView)  entryDetailsView.hidden  = !isEntryDetails;

  if (userSignupView)    userSignupView.hidden    = !isUserSignup;
  if (userLoginView)     userLoginView.hidden     = !isUserLogin;
  if (accountView)       accountView.hidden       = !isAccount;
  if (profileView)       profileView.hidden       = !isProfile;

  // body helpers for CSS
  document.body.classList.toggle('route-home', isHome);
  document.body.classList.toggle('route-list', isList);
  document.body.classList.toggle('route-browse', isBrowse);
  document.body.classList.toggle('route-settings', isSettings);
  document.body.classList.toggle('route-statistics', isStatistics);
  document.body.classList.toggle('route-entrydetails', isEntryDetails);

  document.body.classList.toggle('route-usersignup', isUserSignup);
  document.body.classList.toggle('route-userlogin', isUserLogin);
  document.body.classList.toggle('route-account', isAccount);
  document.body.classList.toggle('route-profile', isProfile);

  // Header active state
  navHomeBtn?.classList.toggle('is-active', isHome);
  navBrowseBtn?.classList.toggle('is-active', isBrowse);
  navListBtn?.classList.toggle('is-active', isList);
  navStatsBtn?.classList.toggle('is-active', isStatistics);
  navSettingsBtn?.classList.toggle('is-active', isSettings);

  // If leaving EntryDetails, clear the body cover background
  if (!isEntryDetails) {
    document.body.removeAttribute('data-entrydetails-bg');
    document.body.style.removeProperty('--entrydetails-bg');
  }

  // render correct view content on navigation
  if (isHome) {
    renderHomePage();
} else if (isList) {
  // If logged in: load list MAL IDs from List Worker, then render
  (async () => {
    try {
      if (isUserLoggedIn?.()) {
        await loadListFromCloudAndHydrate();
      }
    } catch (e) {
      console.warn('List cloud load failed:', e);
      // fallback: keep local list
    }
    renderAnimeCards(); // respects card/list mode
  })();
} else if (isBrowse) {

    renderBrowsePage();
  } else if (isSettings) {
    renderSettingsPage();
  } else if (isStatistics) {
    renderStatisticsPage();
  } else if (isEntryDetails) {
    renderEntryDetailsPage();
  }
  // account/profile/auth are UI-only for now (no JS yet)
}


function initRouting(){
  window.addEventListener('hashchange', applyRoute);

  // Header nav buttons
  navHomeBtn?.addEventListener('click', () => location.hash = '#home');
  navBrowseBtn?.addEventListener('click', () => location.hash = '#browse');
  navListBtn?.addEventListener('click', () => location.hash = '#list');
  navStatsBtn?.addEventListener('click', () => location.hash = '#statistics');
  navSettingsBtn?.addEventListener('click', () => location.hash = '#settings');

  // Profile icon (if not logged in, go login)
  navProfileBtn?.addEventListener('click', () => {
    location.hash = isUserLoggedIn() ? '#profile' : '#userlogin';
  });

  // Header profile links beside the icon (force correct hash + stop bubbling)
  headerProfileLink1?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    location.hash = isUserLoggedIn() ? '#profile' : '#userlogin';
  });

  headerProfileLink2?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    location.hash = isUserLoggedIn() ? '#account' : '#usersignup';
  });

  // Clicking brand goes home (and works with keyboard)
  const brand = document.querySelector('.header-brand');
  brand?.addEventListener('click', () => location.hash = '#home');
  brand?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      location.hash = '#home';
    }
  });

  applyRoute();
}



// View mode (list sidebar)
lsViewBtn?.addEventListener('click', () => {
  UI.viewMode = (UI.viewMode === 'list') ? 'card' : 'list';
  saveUI();

  // sync view buttons that exist
  syncViewModeBtn();
  syncListSidebarViewBtn();
  // syncFloatingSidebarViewBtn(); // <-- REMOVE (not defined in this build)

  renderAnimeCards();
});


/* --------------------------------- Init ----------------------------------- */
function init() {
  loadFromLocalStorage();
  setupEventListeners();
  initAuth();
  __initHomeRowNav();
  __initHomeSectionFilters();

  syncViewModeBtn();
  syncListSidebarViewBtn();
  syncListSidebarStatus();
  syncListSidebarBulkBtn();

  
  renderAnimeCards();
  initSidebarInfoRotator();
  startMALAutoSync(); // <— kick off background sweeps

  // NEW: make Home the opening “page”
  initRouting();
  initBrowseSearch();
}



document.addEventListener('DOMContentLoaded', init);


