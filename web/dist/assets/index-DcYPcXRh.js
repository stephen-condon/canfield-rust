(function() {
  const e = document.createElement("link").relList;
  if (e && e.supports && e.supports("modulepreload")) return;
  for (const a of document.querySelectorAll('link[rel="modulepreload"]')) r(a);
  new MutationObserver((a) => {
    for (const d of a) if (d.type === "childList") for (const c of d.addedNodes) c.tagName === "LINK" && c.rel === "modulepreload" && r(c);
  }).observe(document, { childList: true, subtree: true });
  function n(a) {
    const d = {};
    return a.integrity && (d.integrity = a.integrity), a.referrerPolicy && (d.referrerPolicy = a.referrerPolicy), a.crossOrigin === "use-credentials" ? d.credentials = "include" : a.crossOrigin === "anonymous" ? d.credentials = "omit" : d.credentials = "same-origin", d;
  }
  function r(a) {
    if (a.ep) return;
    a.ep = true;
    const d = n(a);
    fetch(a.href, d);
  }
})();
function q(t, e) {
  const n = v(t, o.__wbindgen_malloc, o.__wbindgen_realloc), r = _, a = v(e, o.__wbindgen_malloc, o.__wbindgen_realloc), d = _, c = o.auto_move_to_foundation(n, r, a, d);
  let s;
  return c[0] !== 0 && (s = y(c[0], c[1]).slice(), o.__wbindgen_free(c[0], c[1] * 1, 1)), s;
}
function K(t) {
  const e = v(t, o.__wbindgen_malloc, o.__wbindgen_realloc), n = _, r = o.draw_from_stock(e, n);
  let a;
  return r[0] !== 0 && (a = y(r[0], r[1]).slice(), o.__wbindgen_free(r[0], r[1] * 1, 1)), a;
}
function Y(t, e, n, r) {
  const a = v(t, o.__wbindgen_malloc, o.__wbindgen_realloc), d = _, c = o.move_tableau_to_tableau(a, d, e, n, r);
  let s;
  return c[0] !== 0 && (s = y(c[0], c[1]).slice(), o.__wbindgen_free(c[0], c[1] * 1, 1)), s;
}
function V(t, e, n) {
  const r = v(t, o.__wbindgen_malloc, o.__wbindgen_realloc), a = _, d = v(e, o.__wbindgen_malloc, o.__wbindgen_realloc), c = _, s = o.move_to_foundation(r, a, d, c, n);
  let i;
  return s[0] !== 0 && (i = y(s[0], s[1]).slice(), o.__wbindgen_free(s[0], s[1] * 1, 1)), i;
}
function Q(t, e, n) {
  const r = v(t, o.__wbindgen_malloc, o.__wbindgen_realloc), a = _, d = v(e, o.__wbindgen_malloc, o.__wbindgen_realloc), c = _, s = o.move_to_tableau(r, a, d, c, n);
  let i;
  return s[0] !== 0 && (i = y(s[0], s[1]).slice(), o.__wbindgen_free(s[0], s[1] * 1, 1)), i;
}
function z(t) {
  let e, n;
  try {
    const r = o.new_game(t);
    return e = r[0], n = r[1], y(r[0], r[1]);
  } finally {
    o.__wbindgen_free(e, n, 1);
  }
}
function X(t) {
  const e = v(t, o.__wbindgen_malloc, o.__wbindgen_realloc), n = _, r = o.redeal_stock(e, n);
  let a;
  return r[0] !== 0 && (a = y(r[0], r[1]).slice(), o.__wbindgen_free(r[0], r[1] * 1, 1)), a;
}
function Z() {
  return { __proto__: null, "./canfield_wasm_bg.js": { __proto__: null, __wbg___wbindgen_is_function_754e9f305ff6029e: function(e) {
    return typeof e == "function";
  }, __wbg___wbindgen_is_object_56732c2bc353f41d: function(e) {
    const n = e;
    return typeof n == "object" && n !== null;
  }, __wbg___wbindgen_is_string_c236cabd84a4d769: function(e) {
    return typeof e == "string";
  }, __wbg___wbindgen_is_undefined_67b456be8673d3d7: function(e) {
    return e === void 0;
  }, __wbg___wbindgen_throw_1506f2235d1bdba0: function(e, n) {
    throw new Error(y(e, n));
  }, __wbg_call_9c758de292015997: function() {
    return x(function(e, n, r) {
      return e.call(n, r);
    }, arguments);
  }, __wbg_crypto_38df2bab126b63dc: function(e) {
    return e.crypto;
  }, __wbg_getRandomValues_c44a50d8cfdaebeb: function() {
    return x(function(e, n) {
      e.getRandomValues(n);
    }, arguments);
  }, __wbg_length_4a591ecaa01354d9: function(e) {
    return e.length;
  }, __wbg_msCrypto_bd5a034af96bcba6: function(e) {
    return e.msCrypto;
  }, __wbg_new_with_length_36a4998e27b014c5: function(e) {
    return new Uint8Array(e >>> 0);
  }, __wbg_node_84ea875411254db1: function(e) {
    return e.node;
  }, __wbg_process_44c7a14e11e9f69e: function(e) {
    return e.process;
  }, __wbg_prototypesetcall_3249fc62a0fafa30: function(e, n, r) {
    Uint8Array.prototype.set.call($(e, n), r);
  }, __wbg_randomFillSync_6c25eac9869eb53c: function() {
    return x(function(e, n) {
      e.randomFillSync(n);
    }, arguments);
  }, __wbg_require_b4edbdcf3e2a1ef0: function() {
    return x(function() {
      return module.require;
    }, arguments);
  }, __wbg_static_accessor_GLOBAL_9d53f2689e622ca1: function() {
    const e = typeof global > "u" ? null : global;
    return M(e) ? 0 : I(e);
  }, __wbg_static_accessor_GLOBAL_THIS_a1a35cec07001a8a: function() {
    const e = typeof globalThis > "u" ? null : globalThis;
    return M(e) ? 0 : I(e);
  }, __wbg_static_accessor_SELF_4c59f6c7ea29a144: function() {
    const e = typeof self > "u" ? null : self;
    return M(e) ? 0 : I(e);
  }, __wbg_static_accessor_WINDOW_e70ae9f2eb052253: function() {
    const e = typeof window > "u" ? null : window;
    return M(e) ? 0 : I(e);
  }, __wbg_subarray_4aa221f6a4f5ab22: function(e, n, r) {
    return e.subarray(n >>> 0, r >>> 0);
  }, __wbg_versions_276b2795b1c6a219: function(e) {
    return e.versions;
  }, __wbindgen_cast_0000000000000001: function(e, n) {
    return $(e, n);
  }, __wbindgen_cast_0000000000000002: function(e, n) {
    return y(e, n);
  }, __wbindgen_init_externref_table: function() {
    const e = o.__wbindgen_externrefs, n = e.grow(4);
    e.set(0, void 0), e.set(n + 0, void 0), e.set(n + 1, null), e.set(n + 2, true), e.set(n + 3, false);
  } } };
}
function I(t) {
  const e = o.__externref_table_alloc();
  return o.__wbindgen_externrefs.set(e, t), e;
}
function $(t, e) {
  return t = t >>> 0, B().subarray(t / 1, t / 1 + e);
}
function y(t, e) {
  return te(t >>> 0, e);
}
let L = null;
function B() {
  return (L === null || L.byteLength === 0) && (L = new Uint8Array(o.memory.buffer)), L;
}
function x(t, e) {
  try {
    return t.apply(this, e);
  } catch (n) {
    const r = I(n);
    o.__wbindgen_exn_store(r);
  }
}
function M(t) {
  return t == null;
}
function v(t, e, n) {
  if (n === void 0) {
    const s = k.encode(t), i = e(s.length, 1) >>> 0;
    return B().subarray(i, i + s.length).set(s), _ = s.length, i;
  }
  let r = t.length, a = e(r, 1) >>> 0;
  const d = B();
  let c = 0;
  for (; c < r; c++) {
    const s = t.charCodeAt(c);
    if (s > 127) break;
    d[a + c] = s;
  }
  if (c !== r) {
    c !== 0 && (t = t.slice(c)), a = n(a, r, r = c + t.length * 3, 1) >>> 0;
    const s = B().subarray(a + c, a + r), i = k.encodeInto(t, s);
    c += i.written, a = n(a, r, c, 1) >>> 0;
  }
  return _ = c, a;
}
let O = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
O.decode();
const ee = 2146435072;
let G = 0;
function te(t, e) {
  return G += e, G >= ee && (O = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }), O.decode(), G = e), O.decode(B().subarray(t, t + e));
}
const k = new TextEncoder();
"encodeInto" in k || (k.encodeInto = function(t, e) {
  const n = k.encode(t);
  return e.set(n), { read: t.length, written: n.length };
});
let _ = 0, o;
function ne(t, e) {
  return o = t.exports, L = null, o.__wbindgen_start(), o;
}
async function se(t, e) {
  if (typeof Response == "function" && t instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function") try {
      return await WebAssembly.instantiateStreaming(t, e);
    } catch (a) {
      if (t.ok && n(t.type) && t.headers.get("Content-Type") !== "application/wasm") console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", a);
      else throw a;
    }
    const r = await t.arrayBuffer();
    return await WebAssembly.instantiate(r, e);
  } else {
    const r = await WebAssembly.instantiate(t, e);
    return r instanceof WebAssembly.Instance ? { instance: r, module: t } : r;
  }
  function n(r) {
    switch (r) {
      case "basic":
      case "cors":
      case "default":
        return true;
    }
    return false;
  }
}
async function re(t) {
  if (o !== void 0) return o;
  t !== void 0 && (Object.getPrototypeOf(t) === Object.prototype ? { module_or_path: t } = t : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), t === void 0 && (t = new URL("/assets/canfield_wasm_bg-DbNPIhms.wasm", import.meta.url));
  const e = Z();
  (typeof t == "string" || typeof Request == "function" && t instanceof Request || typeof URL == "function" && t instanceof URL) && (t = fetch(t));
  const { instance: n, module: r } = await se(await t, e);
  return ne(n);
}
const ae = { hearts: "\u2665", diamonds: "\u2666", clubs: "\u2663", spades: "\u2660" }, oe = { 1: "A", 11: "J", 12: "Q", 13: "K" };
function ie(t) {
  return oe[t] ?? String(t);
}
function U(t) {
  return ae[t] ?? t;
}
function ce(t) {
  return t === "hearts" || t === "diamonds";
}
function S(t, e = {}) {
  const n = document.createElement("div");
  if (n.className = "playing-card", n.dataset.cardId = t.id, !t.faceUp) {
    n.classList.add("face-down");
    const i = document.createElement("div");
    return i.className = "card-back-pattern", n.appendChild(i), n;
  }
  e.isDragging && n.classList.add("dragging"), e.isDropTarget && n.classList.add("drop-active"), e.draggable && (n.draggable = true);
  const r = ce(t.suit) ? "rank-red" : "rank-black";
  n.classList.add(r);
  const a = `${ie(t.rank)}${U(t.suit)}`, d = document.createElement("div");
  d.className = "card-suit-center", d.textContent = U(t.suit), n.appendChild(d);
  const c = document.createElement("div");
  c.className = "card-corner", c.textContent = a, n.appendChild(c);
  const s = document.createElement("div");
  return s.className = "card-corner card-corner-bottom", s.textContent = a, n.appendChild(s), e.draggable && n.addEventListener("dragstart", (i) => {
    var _a;
    (_a = i.dataTransfer) == null ? void 0 : _a.setData("text/plain", t.id), n.dispatchEvent(new CustomEvent("card-drag-start", { detail: t, bubbles: true }));
  }), n.addEventListener("dblclick", () => {
    n.dispatchEvent(new CustomEvent("card-dbl-click", { detail: t, bubbles: true }));
  }), n;
}
const b = { prefs: "canfield:preferences", stats: "canfield:statistics", savedGame: "canfield:savedGame" }, de = { drawCount: 3, backgroundPath: null }, F = { gamesPlayed: 0, wins: 0, losses: 0 };
function J(t, e) {
  try {
    const n = localStorage.getItem(t);
    return n ? JSON.parse(n) : e;
  } catch {
    return e;
  }
}
function P(t, e) {
  localStorage.setItem(t, JSON.stringify(e));
}
const u = { getPreferences: () => J(b.prefs, de), setPreferences: (t) => {
  P(b.prefs, { ...u.getPreferences(), ...t });
}, getStatistics: () => J(b.stats, F), recordWin: () => {
  const t = u.getStatistics();
  P(b.stats, { gamesPlayed: t.gamesPlayed + 1, wins: t.wins + 1, losses: t.losses });
}, recordLoss: () => {
  const t = u.getStatistics();
  P(b.stats, { gamesPlayed: t.gamesPlayed + 1, wins: t.wins, losses: t.losses + 1 });
}, resetStatistics: () => P(b.stats, F), getSavedGame: () => localStorage.getItem(b.savedGame), setSavedGame: (t) => {
  t === null ? localStorage.removeItem(b.savedGame) : localStorage.setItem(b.savedGame, t);
} }, C = () => document.getElementById("app");
function W(t) {
  return JSON.parse(t);
}
let A = null, p = 0;
function le(t) {
  N();
  const e = Date.now() - p;
  A = setInterval(() => {
    p = Date.now() - e, t(p);
  }, 1e3);
}
function N() {
  A && (clearInterval(A), A = null);
}
function H(t) {
  const e = Math.floor(t / 1e3);
  return `${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")}`;
}
function E() {
  var _a;
  N();
  const t = u.getSavedGame();
  C().innerHTML = `
    <div id="screen-menu" class="screen active">
      <div class="menu-card">
        <h1>Canfield</h1>
        <button id="btn-new-game">New Game</button>
        <button id="btn-resume" class="btn-secondary" style="display:none">Resume Game</button>
        <button id="btn-statistics" class="btn-secondary">Statistics</button>
        <button id="btn-preferences" class="btn-secondary">Preferences</button>
      </div>
    </div>`, t && (document.getElementById("btn-resume").style.display = ""), document.getElementById("btn-new-game").addEventListener("click", () => {
    const e = u.getPreferences(), n = z(e.drawCount);
    u.setSavedGame(n), p = 0, D(n);
  }), (_a = document.getElementById("btn-resume")) == null ? void 0 : _a.addEventListener("click", () => {
    if (!t) return;
    p = W(t).elapsedMs, D(t);
  }), document.getElementById("btn-statistics").addEventListener("click", j), document.getElementById("btn-preferences").addEventListener("click", ue);
}
function D(t) {
  let e = W(t);
  function n() {
    const s = document.getElementById("zone-reserve");
    s.innerHTML = "", e.reserve.length > 0 && s.appendChild(S(e.reserve[e.reserve.length - 1], { draggable: true }));
    for (let l = 0; l < 4; l++) {
      const g = document.getElementById(`zone-foundation-${l}`);
      g.innerHTML = "", e.foundations[l].length > 0 && g.appendChild(S(e.foundations[l][e.foundations[l].length - 1]));
    }
    for (let l = 0; l < 4; l++) {
      const g = document.getElementById(`zone-tableau-${l}`);
      g.innerHTML = "", e.tableau[l].forEach((h, R) => {
        const T = S(h, { draggable: h.faceUp });
        T.style.top = `${R * 28}px`, T.style.position = "absolute", T.dataset.colIndex = String(R), g.appendChild(T);
      });
    }
    const i = document.getElementById("zone-stock");
    if (i.innerHTML = "", e.stock.length > 0) {
      const l = { id: "stock", suit: "spades", rank: 1, faceUp: false };
      i.appendChild(S(l));
    }
    const f = document.getElementById("waste-slot");
    f.innerHTML = "";
    const w = Math.min(3, e.waste.length), m = e.waste.length - w;
    for (let l = m; l < e.waste.length; l++) {
      const g = l === e.waste.length - 1, h = S(e.waste[l], { draggable: g });
      h.style.position = "absolute", h.style.left = `${(l - m) * 24}px`, f.appendChild(h);
    }
    document.getElementById("hud-moves").textContent = String(e.moves), e.won && a();
  }
  function r(s) {
    s && (e = W(s), e.elapsedMs = p, u.setSavedGame(JSON.stringify(e)), n());
  }
  function a() {
    N(), u.recordWin(), u.setSavedGame(null);
    const s = document.getElementById("overlay-win");
    s.style.display = "flex", document.getElementById("win-moves").textContent = String(e.moves), document.getElementById("win-time").textContent = H(p);
  }
  function d(s) {
    return e.waste.length > 0 && e.waste[e.waste.length - 1].id === s ? "waste" : e.reserve.length > 0 && e.reserve[e.reserve.length - 1].id === s ? "reserve" : null;
  }
  function c(s) {
    for (let i = 0; i < 4; i++) if (e.tableau[i].some((f) => f.id === s)) return i;
    return null;
  }
  C().innerHTML = `
    <div id="screen-game" class="screen active">
      <div class="hud">
        <span class="hud-stat">Moves <span id="hud-moves">0</span></span>
        <span class="hud-stat">Time <span id="hud-time">0:00</span></span>
        <span class="hud-spacer"></span>
        <button id="btn-surrender">Surrender</button>
        <button class="btn-secondary" id="btn-menu">Menu</button>
      </div>
      <div class="board">
        <div id="zone-reserve" class="zone reserve-slot" style="grid-column:1;grid-row:1"></div>
        <div id="zone-stock" class="zone stock-slot" style="grid-column:2;grid-row:1"></div>
        <div id="waste-slot" class="zone waste-slot" style="grid-column:3;grid-row:1"></div>
        ${[0, 1, 2, 3].map((s) => `<div id="zone-foundation-${s}" class="zone foundation-slot" data-foundation="${s}" style="grid-column:${5 + s};grid-row:1"></div>`).join("")}
        ${[0, 1, 2, 3].map((s) => `<div id="zone-tableau-${s}" class="zone tableau-col" data-col="${s}" style="grid-column:${5 + s};grid-row:2;position:relative"></div>`).join("")}
      </div>
      <div id="overlay-surrender" style="display:none" class="overlay">
        <p>Surrender this game?</p>
        <button id="btn-confirm-surrender">Surrender</button>
        <button id="btn-keep-playing">Keep Playing</button>
      </div>
      <div id="overlay-post-surrender" style="display:none" class="overlay">
        <p>Game over.</p>
        <button id="btn-new-game-after">New Game</button>
        <button id="btn-main-menu-after">Main Menu</button>
      </div>
      <div id="overlay-win" style="display:none" class="overlay">
        <h2>You Won!</h2>
        <p>Moves: <span id="win-moves"></span></p>
        <p>Time: <span id="win-time"></span></p>
        <button id="btn-play-again">Play Again</button>
        <button id="btn-main-menu-win">Main Menu</button>
      </div>
    </div>`, document.getElementById("zone-stock").addEventListener("click", () => {
    r(K(JSON.stringify(e)) ?? X(JSON.stringify(e)));
  });
  for (let s = 0; s < 4; s++) {
    const i = document.getElementById(`zone-foundation-${s}`);
    i.addEventListener("dragover", (f) => f.preventDefault()), i.addEventListener("drop", (f) => {
      var _a;
      f.preventDefault();
      const w = ((_a = f.dataTransfer) == null ? void 0 : _a.getData("text/plain")) ?? "", m = d(w);
      m && r(V(JSON.stringify(e), m, s));
    });
  }
  for (let s = 0; s < 4; s++) {
    const i = document.getElementById(`zone-tableau-${s}`);
    i.addEventListener("dragover", (f) => f.preventDefault()), i.addEventListener("drop", (f) => {
      var _a;
      f.preventDefault();
      const w = ((_a = f.dataTransfer) == null ? void 0 : _a.getData("text/plain")) ?? "", m = c(w);
      if (m !== null) {
        const l = e.tableau[m].findIndex((g) => g.id === w);
        r(Y(JSON.stringify(e), m, l, s));
      } else {
        const l = d(w);
        l && r(Q(JSON.stringify(e), l, s));
      }
    });
  }
  C().addEventListener("card-dbl-click", (s) => {
    const i = s.detail, f = d(i.id);
    f && r(q(JSON.stringify(e), f));
  }), document.getElementById("btn-surrender").addEventListener("click", () => {
    document.getElementById("overlay-surrender").style.display = "flex";
  }), document.getElementById("btn-keep-playing").addEventListener("click", () => {
    document.getElementById("overlay-surrender").style.display = "none";
  }), document.getElementById("btn-confirm-surrender").addEventListener("click", () => {
    N(), u.recordLoss(), u.setSavedGame(null), document.getElementById("overlay-surrender").style.display = "none", document.getElementById("overlay-post-surrender").style.display = "flex";
  }), document.getElementById("btn-new-game-after").addEventListener("click", () => {
    const s = u.getPreferences(), i = z(s.drawCount);
    p = 0, u.setSavedGame(i), D(i);
  }), document.getElementById("btn-main-menu-after").addEventListener("click", E), document.getElementById("btn-play-again").addEventListener("click", () => {
    const s = u.getPreferences(), i = z(s.drawCount);
    p = 0, u.setSavedGame(i), D(i);
  }), document.getElementById("btn-main-menu-win").addEventListener("click", E), document.getElementById("btn-menu").addEventListener("click", E), le((s) => {
    const i = document.getElementById("hud-time");
    i && (i.textContent = H(s));
  }), n();
}
function j() {
  const t = u.getStatistics(), e = t.gamesPlayed > 0 ? Math.round(t.wins / t.gamesPlayed * 100) : 0;
  C().innerHTML = `
    <div id="screen-stats" class="screen active">
      <div class="menu-card">
        <h2>Statistics</h2>
        <div class="stat-value">Games Played <span id="stat-played"></span></div>
        <div class="stat-value">Wins <span id="stat-wins"></span></div>
        <div class="stat-value">Losses <span id="stat-losses"></span></div>
        <div class="stat-value">Win % <span id="stat-pct"></span></div>
        <button id="btn-reset-stats">Reset Statistics</button>
        <button id="btn-back-stats">Back</button>
      </div>
    </div>`, document.getElementById("stat-played").textContent = String(t.gamesPlayed), document.getElementById("stat-wins").textContent = String(t.wins), document.getElementById("stat-losses").textContent = String(t.losses), document.getElementById("stat-pct").textContent = `${e}%`, document.getElementById("btn-reset-stats").addEventListener("click", () => {
    u.resetStatistics(), j();
  }), document.getElementById("btn-back-stats").addEventListener("click", E);
}
function ue() {
  const t = u.getPreferences();
  C().innerHTML = `
    <div id="screen-prefs" class="screen active">
      <div class="menu-card">
        <h2>Preferences</h2>
        <label>
          Draw Count:
          <select id="pref-draw-count">
            <option value="1">Draw 1</option>
            <option value="3">Draw 3</option>
          </select>
        </label>
        <button id="btn-save-prefs">Save</button>
        <button id="btn-back-prefs" class="btn-secondary">Back</button>
      </div>
    </div>`;
  const e = document.getElementById("pref-draw-count");
  e.value = String(t.drawCount), document.getElementById("btn-save-prefs").addEventListener("click", () => {
    const n = document.getElementById("pref-draw-count").value;
    u.setPreferences({ drawCount: Number(n) }), E();
  }), document.getElementById("btn-back-prefs").addEventListener("click", E);
}
async function fe() {
  await re(), E();
}
fe();
