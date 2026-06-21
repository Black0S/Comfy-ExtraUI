// comfy-extra-ui — point d'entrée pour personnaliser litegraph + le chrome.
//
// Tu écris dans la « ZONE À MODIFIER ». La « PLOMBERIE » garantit que tout
// s'applique ET persiste (ComfyUI recrée le canvas / ré-applique sa palette).
//
// Repères : window.LiteGraph · app.canvas · app.graph._nodes · app.runningNodeId
//           Dans drawBackground/drawForeground, `ctx` est en COORDONNÉES GRAPHE.
// Le STYLE du chrome (barres, panneaux) se fait dans ./style.css.

import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

// ═══════════════════════════════════════════════════════════════
//  ZONE À MODIFIER
// ═══════════════════════════════════════════════════════════════

// (1) Réglages litegraph.
function applyLiteGraph(LG, canvas) {
  // Masque la grille de LIGNES native (on dessine nos points à la place).
  canvas.background_image = "";
  // litegraph ne peint le fond qu'en dessous de 150% de zoom ; au-delà c'est
  // le <body> qui apparaît. On l'aligne sur la couleur (native) du canvas →
  // plus de changement de couleur au zoom.
  if (canvas.clear_background_color) {
    document.body.style.backgroundColor = canvas.clear_background_color;
  }
  // L'accent du thème (--p-primary-color) est une propriété @property : lisible
  // via getComputedStyle mais sa substitution var() casse dans nos règles.
  // On le recopie en VALEUR CONCRÈTE dans --cs-accent (utilisable dans style.css).
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--p-primary-color").trim();
  if (accent) document.documentElement.style.setProperty("--cs-accent", accent);
  // Les nodes s'alignent toujours sur la grille de tiling, à tout zoom.
  LG.alwaysSnapToGrid = true;
  if (!LG.CANVAS_GRID_SIZE) LG.CANVAS_GRID_SIZE = 20;
}

// (2) Fond DERRIÈRE les nodes : grille de POINTS calée sur la grille de snap,
//     couleur dérivée du thème, fondu doux entre paliers de zoom.
function drawBackground(ctx, area, canvas) {
  const [x, y, w, h] = area;
  const scale = canvas.ds?.scale || 1;
  const fg =
    getComputedStyle(document.documentElement).getPropertyValue("--fg-color").trim() || "#ffffff";

  const G = (window.LiteGraph && window.LiteGraph.CANVAS_GRID_SIZE) || 20;
  const TARGET = 22;
  let step = G;
  while (step * scale < TARGET) step *= 2; // dézoom → on regroupe (jamais sous G)
  const coarsened = step > G;
  const t = coarsened ? Math.min(1, (step * scale - TARGET) / TARGET) : 0;
  const r = 1.3 / scale;
  const A = 0.18;

  ctx.save();
  ctx.fillStyle = fg;

  ctx.globalAlpha = A;
  ctx.beginPath();
  const x0 = Math.floor(x / step) * step;
  const y0 = Math.floor(y / step) * step;
  for (let gx = x0; gx <= x + w; gx += step)
    for (let gy = y0; gy <= y + h; gy += step) {
      ctx.moveTo(gx + r, gy);
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
    }
  ctx.fill();

  if (coarsened && t > 0.01) {
    ctx.globalAlpha = A * t;
    ctx.beginPath();
    const half = step / 2;
    const ix0 = Math.floor(x / half), ix1 = Math.ceil((x + w) / half);
    const iy0 = Math.floor(y / half), iy1 = Math.ceil((y + h) / half);
    for (let ix = ix0; ix <= ix1; ix++)
      for (let iy = iy0; iy <= iy1; iy++) {
        if ((ix & 1) === 0 && (iy & 1) === 0) continue;
        const gx = ix * half, gy = iy * half;
        ctx.moveTo(gx + r, gy);
        ctx.arc(gx, gy, r, 0, Math.PI * 2);
      }
    ctx.fill();
  }
  ctx.restore();
}

// (3) Rendu DEVANT les nodes (overlay). Vide pour l'instant.
function drawForeground(ctx, area, canvas) {}

// ═══════════════════════════════════════════════════════════════
//  PLOMBERIE  (normalement, pas besoin d'y toucher)
// ═══════════════════════════════════════════════════════════════

function injectCSS() {
  if (document.querySelector("link[data-comfy-extra]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("./style.css", import.meta.url).href;
  link.dataset.comfyExtra = "1";
  document.head.appendChild(link);
}

// Onglet sélectionné du rail : style en INLINE (la cascade Vue/scoped bat le CSS
// ici). Accent = couleur primaire du thème. Recalculé à chaque tick.
function styleSelectedTab() {
  const accent =
    getComputedStyle(document.documentElement).getPropertyValue("--p-primary-color").trim() || "#60a5fa";
  const tint = /^#[0-9a-f]{6}$/i.test(accent) ? accent + "29" : accent; // ~16% d'alpha
  document.querySelectorAll(".side-bar-button").forEach((btn) => {
    const i = btn.querySelector("i");
    if (btn.classList.contains("side-bar-button-selected")) {
      if (i) i.style.setProperty("color", accent, "important");
      btn.style.setProperty("background-color", tint, "important");
      btn.style.setProperty("border-left", "2px solid " + accent, "important");
    } else {
      if (i) i.style.removeProperty("color");
      btn.style.removeProperty("background-color");
      btn.style.removeProperty("border-left");
    }
  });
}

function installBg(canvas) {
  if (canvas.__extraBg && canvas.onDrawBackground === canvas.__extraBg) return;
  const prev = canvas.onDrawBackground !== canvas.__extraBg ? canvas.onDrawBackground : null;
  const wrap = function (ctx, area) {
    if (prev) { try { prev.call(this, ctx, area); } catch (e) { /* */ } }
    try { drawBackground(ctx, area, canvas); } catch (e) { console.warn("[comfy-extra-ui] drawBackground:", e); }
  };
  canvas.onDrawBackground = wrap;
  canvas.__extraBg = wrap;
}

function installFg(canvas) {
  if (canvas.__extraFg && canvas.onDrawForeground === canvas.__extraFg) return;
  const prev = canvas.onDrawForeground !== canvas.__extraFg ? canvas.onDrawForeground : null;
  const wrap = function (ctx, area) {
    if (prev) { try { prev.call(this, ctx, area); } catch (e) { /* */ } }
    try { drawForeground(ctx, area, canvas); } catch (e) { console.warn("[comfy-extra-ui] drawForeground:", e); }
  };
  canvas.onDrawForeground = wrap;
  canvas.__extraFg = wrap;
}

let keeper = null;
let lastCanvas = null;
function tick() {
  const LG = window.LiteGraph;
  const c = app && app.canvas;
  if (!LG || !c) return;
  let changed = c !== lastCanvas;
  lastCanvas = c;
  if (c.background_image) changed = true;
  try { applyLiteGraph(LG, c); } catch (e) { console.warn("[comfy-extra-ui] applyLiteGraph:", e); }
  if (!c.__extraBg || c.onDrawBackground !== c.__extraBg) { installBg(c); changed = true; }
  if (!c.__extraFg || c.onDrawForeground !== c.__extraFg) { installFg(c); changed = true; }
  if (changed) c.setDirty(true, true);
  styleSelectedTab();
}

app.registerExtension({
  name: "ComfyExtraUI",
  async setup() {
    injectCSS();
    tick();
    if (!keeper) keeper = setInterval(tick, 500);
    // Console : window.comfyExtra.refresh() / .alignAll()
    window.comfyExtra = {
      app, api,
      get LiteGraph() { return window.LiteGraph; },
      refresh: tick,
      alignAll() {
        const g = app.graph, c = app.canvas;
        const G = (window.LiteGraph && window.LiteGraph.CANVAS_GRID_SIZE) || 20;
        for (const n of (g && g._nodes) || []) {
          n.pos[0] = Math.round(n.pos[0] / G) * G;
          n.pos[1] = Math.round(n.pos[1] / G) * G;
        }
        c && c.setDirty(true, true);
      },
    };
  },
});
