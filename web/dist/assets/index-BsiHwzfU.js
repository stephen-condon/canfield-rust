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
function J(t, e) {
  const n = y(t, o.__wbindgen_malloc, o.__wbindgen_realloc), r = g, a = y(e, o.__wbindgen_malloc, o.__wbindgen_realloc), d = g, c = o.auto_move_to_foundation(n, r, a, d);
  let s;
  return c[0] !== 0 && (s = p(c[0], c[1]).slice(), o.__wbindgen_free(c[0], c[1] * 1, 1)), s;
}
function H(t) {
  const e = y(t, o.__wbindgen_malloc, o.__wbindgen_realloc), n = g, r = o.draw_from_stock(e, n);
  let a;
  return r[0] !== 0 && (a = p(r[0], r[1]).slice(), o.__wbindgen_free(r[0], r[1] * 1, 1)), a;
}
function j(t, e, n, r) {
  const a = y(t, o.__wbindgen_malloc, o.__wbindgen_realloc), d = g, c = o.move_tableau_to_tableau(a, d, e, n, r);
  let s;
  return c[0] !== 0 && (s = p(c[0], c[1]).slice(), o.__wbindgen_free(c[0], c[1] * 1, 1)), s;
}
function q(t, e, n) {
  const r = y(t, o.__wbindgen_malloc, o.__wbindgen_realloc), a = g, d = y(e, o.__wbindgen_malloc, o.__wbindgen_realloc), c = g, s = o.move_to_foundation(r, a, d, c, n);
  let i;
  return s[0] !== 0 && (i = p(s[0], s[1]).slice(), o.__wbindgen_free(s[0], s[1] * 1, 1)), i;
}
function K(t, e, n) {
  const r = y(t, o.__wbindgen_malloc, o.__wbindgen_realloc), a = g, d = y(e, o.__wbindgen_malloc, o.__wbindgen_realloc), c = g, s = o.move_to_tableau(r, a, d, c, n);
  let i;
  return s[0] !== 0 && (i = p(s[0], s[1]).slice(), o.__wbindgen_free(s[0], s[1] * 1, 1)), i;
}
function G(t) {
  let e, n;
  try {
    const r = o.new_game(t);
    return e = r[0], n = r[1], p(r[0], r[1]);
  } finally {
    o.__wbindgen_free(e, n, 1);
  }
}
function Y(t) {
  const e = y(t, o.__wbindgen_malloc, o.__wbindgen_realloc), n = g, r = o.redeal_stock(e, n);
  let a;
  return r[0] !== 0 && (a = p(r[0], r[1]).slice(), o.__wbindgen_free(r[0], r[1] * 1, 1)), a;
}
function V() {
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
    throw new Error(p(e, n));
  }, __wbg_call_9c758de292015997: function() {
    return C(function(e, n, r) {
      return e.call(n, r);
    }, arguments);
  }, __wbg_crypto_38df2bab126b63dc: function(e) {
    return e.crypto;
  }, __wbg_getRandomValues_c44a50d8cfdaebeb: function() {
    return C(function(e, n) {
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
    Uint8Array.prototype.set.call(W(e, n), r);
  }, __wbg_randomFillSync_6c25eac9869eb53c: function() {
    return C(function(e, n) {
      e.randomFillSync(n);
    }, arguments);
  }, __wbg_require_b4edbdcf3e2a1ef0: function() {
    return C(function() {
      return module.require;
    }, arguments);
  }, __wbg_static_accessor_GLOBAL_9d53f2689e622ca1: function() {
    const e = typeof global > "u" ? null : global;
    return M(e) ? 0 : h(e);
  }, __wbg_static_accessor_GLOBAL_THIS_a1a35cec07001a8a: function() {
    const e = typeof globalThis > "u" ? null : globalThis;
    return M(e) ? 0 : h(e);
  }, __wbg_static_accessor_SELF_4c59f6c7ea29a144: function() {
    const e = typeof self > "u" ? null : self;
    return M(e) ? 0 : h(e);
  }, __wbg_static_accessor_WINDOW_e70ae9f2eb052253: function() {
    const e = typeof window > "u" ? null : window;
    return M(e) ? 0 : h(e);
  }, __wbg_subarray_4aa221f6a4f5ab22: function(e, n, r) {
    return e.subarray(n >>> 0, r >>> 0);
  }, __wbg_versions_276b2795b1c6a219: function(e) {
    return e.versions;
  }, __wbindgen_cast_0000000000000001: function(e, n) {
    return W(e, n);
  }, __wbindgen_cast_0000000000000002: function(e, n) {
    return p(e, n);
  }, __wbindgen_init_externref_table: function() {
    const e = o.__wbindgen_externrefs, n = e.grow(4);
    e.set(0, void 0), e.set(n + 0, void 0), e.set(n + 1, null), e.set(n + 2, true), e.set(n + 3, false);
  } } };
}
function h(t) {
  const e = o.__externref_table_alloc();
  return o.__wbindgen_externrefs.set(e, t), e;
}
function W(t, e) {
  return t = t >>> 0, I().subarray(t / 1, t / 1 + e);
}
function p(t, e) {
  return X(t >>> 0, e);
}
let S = null;
function I() {
  return (S === null || S.byteLength === 0) && (S = new Uint8Array(o.memory.buffer)), S;
}
function C(t, e) {
  try {
    return t.apply(this, e);
  } catch (n) {
    const r = h(n);
    o.__wbindgen_exn_store(r);
  }
}
function M(t) {
  return t == null;
}
function y(t, e, n) {
  if (n === void 0) {
    const s = L.encode(t), i = e(s.length, 1) >>> 0;
    return I().subarray(i, i + s.length).set(s), g = s.length, i;
  }
  let r = t.length, a = e(r, 1) >>> 0;
  const d = I();
  let c = 0;
  for (; c < r; c++) {
    const s = t.charCodeAt(c);
    if (s > 127) break;
    d[a + c] = s;
  }
  if (c !== r) {
    c !== 0 && (t = t.slice(c)), a = n(a, r, r = c + t.length * 3, 1) >>> 0;
    const s = I().subarray(a + c, a + r), i = L.encodeInto(t, s);
    c += i.written, a = n(a, r, c, 1) >>> 0;
  }
  return g = c, a;
}
let P = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
P.decode();
const Q = 2146435072;
let N = 0;
function X(t, e) {
  return N += e, N >= Q && (P = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }), P.decode(), N = e), P.decode(I().subarray(t, t + e));
}
const L = new TextEncoder();
"encodeInto" in L || (L.encodeInto = function(t, e) {
  const n = L.encode(t);
  return e.set(n), { read: t.length, written: n.length };
});
let g = 0, o;
function Z(t, e) {
  return o = t.exports, S = null, o.__wbindgen_start(), o;
}
async function ee(t, e) {
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
async function te(t) {
  if (o !== void 0) return o;
  t !== void 0 && (Object.getPrototypeOf(t) === Object.prototype ? { module_or_path: t } = t : console.warn("using deprecated parameters for the initialization function; pass a single object instead")), t === void 0 && (t = new URL("/assets/canfield_wasm_bg-DbNPIhms.wasm", import.meta.url));
  const e = V();
  (typeof t == "string" || typeof Request == "function" && t instanceof Request || typeof URL == "function" && t instanceof URL) && (t = fetch(t));
  const { instance: n, module: r } = await ee(await t, e);
  return Z(n);
}
const ne = { hearts: "\u2665", diamonds: "\u2666", clubs: "\u2663", spades: "\u2660" }, se = { 1: "A", 11: "J", 12: "Q", 13: "K" };
function re(t) {
  return se[t] ?? String(t);
}
function ae(t) {
  return ne[t] ?? t;
}
function oe(t) {
  return t === "hearts" || t === "diamonds";
}
function E(t, e = {}) {
  const n = document.createElement("div");
  if (n.className = "playing-card", n.dataset.cardId = t.id, !t.faceUp) {
    n.classList.add("face-down");
    const d = document.createElement("div");
    return d.className = "card-back-pattern", n.appendChild(d), n;
  }
  e.isDragging && n.classList.add("dragging"), e.isDropTarget && n.classList.add("drop-active"), e.draggable && (n.draggable = true);
  const r = oe(t.suit) ? "rank-red" : "rank-black";
  n.classList.add(r);
  const a = document.createElement("div");
  return a.className = "card-corner", a.textContent = `${re(t.rank)}${ae(t.suit)}`, n.appendChild(a), e.draggable && n.addEventListener("dragstart", (d) => {
    var _a;
    (_a = d.dataTransfer) == null ? void 0 : _a.setData("text/plain", t.id), n.dispatchEvent(new CustomEvent("card-drag-start", { detail: t, bubbles: true }));
  }), n.addEventListener("dblclick", () => {
    n.dispatchEvent(new CustomEvent("card-dbl-click", { detail: t, bubbles: true }));
  }), n;
}
const b = { prefs: "canfield:preferences", stats: "canfield:statistics", savedGame: "canfield:savedGame" }, ie = { drawCount: 3, backgroundPath: null }, R = { gamesPlayed: 0, wins: 0, losses: 0 };
function $(t, e) {
  try {
    const n = localStorage.getItem(t);
    return n ? JSON.parse(n) : e;
  } catch {
    return e;
  }
}
function x(t, e) {
  localStorage.setItem(t, JSON.stringify(e));
}
const u = { getPreferences: () => $(b.prefs, ie), setPreferences: (t) => {
  x(b.prefs, { ...u.getPreferences(), ...t });
}, getStatistics: () => $(b.stats, R), recordWin: () => {
  const t = u.getStatistics();
  x(b.stats, { gamesPlayed: t.gamesPlayed + 1, wins: t.wins + 1, losses: t.losses });
}, recordLoss: () => {
  const t = u.getStatistics();
  x(b.stats, { gamesPlayed: t.gamesPlayed + 1, wins: t.wins, losses: t.losses + 1 });
}, resetStatistics: () => x(b.stats, R), getSavedGame: () => localStorage.getItem(b.savedGame), setSavedGame: (t) => {
  t === null ? localStorage.removeItem(b.savedGame) : localStorage.setItem(b.savedGame, t);
} }, B = () => document.getElementById("app");
function z(t) {
  return JSON.parse(t);
}
let O = null, m = 0;
function ce(t) {
  A();
  const e = Date.now() - m;
  O = setInterval(() => {
    m = Date.now() - e, t(m);
  }, 1e3);
}
function A() {
  O && (clearInterval(O), O = null);
}
function U(t) {
  const e = Math.floor(t / 1e3);
  return `${Math.floor(e / 60)}:${String(e % 60).padStart(2, "0")}`;
}
function w() {
  var _a;
  A();
  const t = u.getSavedGame();
  B().innerHTML = `
    <div id="screen-menu" class="screen active">
      <h1>Canfield Solitaire</h1>
      <button id="btn-new-game">New Game</button>
      <button id="btn-resume" style="display:none">Resume Game</button>
      <button id="btn-statistics">Statistics</button>
      <button id="btn-preferences">Preferences</button>
    </div>`, t && (document.getElementById("btn-resume").style.display = ""), document.getElementById("btn-new-game").addEventListener("click", () => {
    const e = u.getPreferences(), n = G(e.drawCount);
    u.setSavedGame(n), m = 0, D(n);
  }), (_a = document.getElementById("btn-resume")) == null ? void 0 : _a.addEventListener("click", () => {
    if (!t) return;
    m = z(t).elapsedMs, D(t);
  }), document.getElementById("btn-statistics").addEventListener("click", F), document.getElementById("btn-preferences").addEventListener("click", de);
}
function D(t) {
  let e = z(t);
  function n() {
    const s = document.getElementById("zone-reserve");
    s.innerHTML = "", e.reserve.length > 0 && s.appendChild(E(e.reserve[e.reserve.length - 1], { draggable: true }));
    for (let l = 0; l < 4; l++) {
      const _ = document.getElementById(`zone-foundation-${l}`);
      _.innerHTML = "", e.foundations[l].length > 0 && _.appendChild(E(e.foundations[l][e.foundations[l].length - 1]));
    }
    for (let l = 0; l < 4; l++) {
      const _ = document.getElementById(`zone-tableau-${l}`);
      _.innerHTML = "", e.tableau[l].forEach((v, k) => {
        const T = E(v, { draggable: v.faceUp });
        T.style.top = `${k * 28}px`, T.style.position = "absolute", T.dataset.colIndex = String(k), _.appendChild(T);
      });
    }
    const i = document.getElementById("zone-stock");
    if (i.innerHTML = "", e.stock.length > 0) {
      const l = { id: "stock", suit: "spades", rank: 1, faceUp: false };
      i.appendChild(E(l));
    }
    const f = document.getElementById("waste-slot");
    f.innerHTML = "", e.waste.length > 0 && f.appendChild(E(e.waste[e.waste.length - 1], { draggable: true })), document.getElementById("hud-moves").textContent = String(e.moves), e.won && a();
  }
  function r(s) {
    s && (e = z(s), e.elapsedMs = m, u.setSavedGame(JSON.stringify(e)), n());
  }
  function a() {
    A(), u.recordWin(), u.setSavedGame(null);
    const s = document.getElementById("overlay-win");
    s.style.display = "flex", document.getElementById("win-moves").textContent = String(e.moves), document.getElementById("win-time").textContent = U(m);
  }
  function d(s) {
    return e.waste.length > 0 && e.waste[e.waste.length - 1].id === s ? "waste" : e.reserve.length > 0 && e.reserve[e.reserve.length - 1].id === s ? "reserve" : null;
  }
  function c(s) {
    for (let i = 0; i < 4; i++) if (e.tableau[i].some((f) => f.id === s)) return i;
    return null;
  }
  B().innerHTML = `
    <div id="screen-game" class="screen active">
      <div class="hud">
        <span class="hud-stat">Moves: <span id="hud-moves">0</span></span>
        <span class="hud-stat">Time: <span id="hud-time">0:00</span></span>
        <button id="btn-surrender">Surrender</button>
        <button class="btn-secondary" id="btn-menu">Menu</button>
      </div>
      <div class="board">
        <div id="zone-reserve" class="zone reserve-slot"></div>
        <div class="foundations">
          ${[0, 1, 2, 3].map((s) => `<div id="zone-foundation-${s}" class="zone foundation-slot" data-foundation="${s}"></div>`).join("")}
        </div>
        <div class="tableau">
          ${[0, 1, 2, 3].map((s) => `<div id="zone-tableau-${s}" class="zone tableau-col" data-col="${s}" style="position:relative;min-height:200px"></div>`).join("")}
        </div>
        <div class="stock-area">
          <div id="zone-stock" class="zone stock-slot"></div>
          <div id="waste-slot" class="zone waste-slot"></div>
        </div>
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
    r(H(JSON.stringify(e)) ?? Y(JSON.stringify(e)));
  });
  for (let s = 0; s < 4; s++) {
    const i = document.getElementById(`zone-foundation-${s}`);
    i.addEventListener("dragover", (f) => f.preventDefault()), i.addEventListener("drop", (f) => {
      var _a;
      f.preventDefault();
      const l = ((_a = f.dataTransfer) == null ? void 0 : _a.getData("text/plain")) ?? "", _ = d(l);
      _ && r(q(JSON.stringify(e), _, s));
    });
  }
  for (let s = 0; s < 4; s++) {
    const i = document.getElementById(`zone-tableau-${s}`);
    i.addEventListener("dragover", (f) => f.preventDefault()), i.addEventListener("drop", (f) => {
      var _a;
      f.preventDefault();
      const l = ((_a = f.dataTransfer) == null ? void 0 : _a.getData("text/plain")) ?? "", _ = c(l);
      if (_ !== null) {
        const v = e.tableau[_].findIndex((k) => k.id === l);
        r(j(JSON.stringify(e), _, v, s));
      } else {
        const v = d(l);
        v && r(K(JSON.stringify(e), v, s));
      }
    });
  }
  B().addEventListener("card-dbl-click", (s) => {
    const i = s.detail, f = d(i.id);
    f && r(J(JSON.stringify(e), f));
  }), document.getElementById("btn-surrender").addEventListener("click", () => {
    document.getElementById("overlay-surrender").style.display = "flex";
  }), document.getElementById("btn-keep-playing").addEventListener("click", () => {
    document.getElementById("overlay-surrender").style.display = "none";
  }), document.getElementById("btn-confirm-surrender").addEventListener("click", () => {
    A(), u.recordLoss(), u.setSavedGame(null), document.getElementById("overlay-surrender").style.display = "none", document.getElementById("overlay-post-surrender").style.display = "flex";
  }), document.getElementById("btn-new-game-after").addEventListener("click", () => {
    const s = u.getPreferences(), i = G(s.drawCount);
    m = 0, u.setSavedGame(i), D(i);
  }), document.getElementById("btn-main-menu-after").addEventListener("click", w), document.getElementById("btn-play-again").addEventListener("click", () => {
    const s = u.getPreferences(), i = G(s.drawCount);
    m = 0, u.setSavedGame(i), D(i);
  }), document.getElementById("btn-main-menu-win").addEventListener("click", w), document.getElementById("btn-menu").addEventListener("click", w), ce((s) => {
    const i = document.getElementById("hud-time");
    i && (i.textContent = U(s));
  }), n();
}
function F() {
  const t = u.getStatistics(), e = t.gamesPlayed > 0 ? Math.round(t.wins / t.gamesPlayed * 100) : 0;
  B().innerHTML = `
    <div id="screen-stats" class="screen active">
      <h2>Statistics</h2>
      <div class="stat-value">Games Played: <span id="stat-played"></span></div>
      <div class="stat-value">Wins: <span id="stat-wins"></span></div>
      <div class="stat-value">Losses: <span id="stat-losses"></span></div>
      <div class="stat-value">Win %: <span id="stat-pct"></span></div>
      <button id="btn-reset-stats">Reset Statistics</button>
      <button id="btn-back-stats">Back</button>
    </div>`, document.getElementById("stat-played").textContent = String(t.gamesPlayed), document.getElementById("stat-wins").textContent = String(t.wins), document.getElementById("stat-losses").textContent = String(t.losses), document.getElementById("stat-pct").textContent = `${e}%`, document.getElementById("btn-reset-stats").addEventListener("click", () => {
    u.resetStatistics(), F();
  }), document.getElementById("btn-back-stats").addEventListener("click", w);
}
function de() {
  const t = u.getPreferences();
  B().innerHTML = `
    <div id="screen-prefs" class="screen active">
      <h2>Preferences</h2>
      <label>
        Draw Count:
        <select id="pref-draw-count">
          <option value="1">Draw 1</option>
          <option value="3">Draw 3</option>
        </select>
      </label>
      <button id="btn-save-prefs">Save</button>
      <button id="btn-back-prefs">Back</button>
    </div>`;
  const e = document.getElementById("pref-draw-count");
  e.value = String(t.drawCount), document.getElementById("btn-save-prefs").addEventListener("click", () => {
    const n = document.getElementById("pref-draw-count").value;
    u.setPreferences({ drawCount: Number(n) }), w();
  }), document.getElementById("btn-back-prefs").addEventListener("click", w);
}
async function le() {
  await te(), w();
}
le();
