/* ═══════════════════════════════════════════════
   LEMONADE STAND — game.js
   Full game logic: orders, cup fills, timer, scoring
═══════════════════════════════════════════════ */

'use strict';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const INGREDIENTS = ['water', 'ice', 'sugar', 'lemon'];
const MAX_EACH    = 4;      // max units of each ingredient
const CUP_INNER_H = 196;    // usable SVG height inside cup (px)
const CUP_BOTTOM  = 214;    // SVG y for cup base

// ─── STATE ───────────────────────────────────────────────────────────────────
let current    = { water: 0, ice: 0, sugar: 0, lemon: 0 };
let target     = { water: 0, ice: 0, sugar: 0, lemon: 0 };
let denom      = { water: 4, ice: 4, sugar: 4, lemon: 4 }; // per-ingredient denominator
let score      = { correct: 0, wrong: 0 };
let orderNum   = 0;
let orderDone  = false;
let bubbleID   = null;

// ─── ELEMENT CACHE ───────────────────────────────────────────────────────────
const el = id => document.getElementById(id);

const els = {
  feedback:   el('feedback'),
  orderNum:   el('order-num'),
  serveBtn:   el('serve-btn'),
  nextBtn:    el('next-btn'),
  sCorrect:   el('s-correct'),
  sWrong:     el('s-wrong'),
  surface:    el('liquid-surface'),
  straw:      el('straw'),
  iceCubes:   el('ice-cubes'),
  lemonSlice: el('lemon-slice'),
  bubbleGrp:  el('bubble-group'),
};

// ─── PARSE FRACTION STRING INTO NUMERATOR + DENOMINATOR ──────────────────────
function parseFrac(fracStr) {
  const [n, d] = fracStr.split('/').map(Number);
  return { n, d };
}

// ─── SCALE GAME CANVAS ───────────────────────────────────────────────────────
function scaleGame() {
  const scale = Math.min(window.innerWidth / 1024, window.innerHeight / 576);
  const game = document.getElementById('game');
  const sat  = document.getElementById('sat-panel');
  const earn  = document.getElementById('earnings-panel');
  const pause = document.getElementById('pause-btn');
  if (game)  game.style.transform   = `scale(${scale})`;
  if (sat)   { sat.style.transform   = `scale(${scale})`;  sat.style.transformOrigin   = 'top right';  }
  if (earn)  { earn.style.transform  = `scale(${scale})`; earn.style.transformOrigin  = 'top left';   }
  if (pause) { pause.style.transform = `scale(${scale})`; pause.style.transformOrigin = 'top center'; }
}
window.addEventListener('resize', scaleGame);

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  scaleGame();
  spawnDecoLemons();

  // If scene 1 passed a ticket order, use it as the first recipe
  const saved = localStorage.getItem('lemonadeOrder');
  if (saved) {
    localStorage.removeItem('lemonadeOrder');
    const fracs = JSON.parse(saved);
    orderNum++;
    orderDone = false;
    INGREDIENTS.forEach(k => { current[k] = 0; });
    INGREDIENTS.forEach(k => {
      const { n, d } = parseFrac(fracs[k]);
      target[k] = n;
      denom[k]  = d;
    });
    els.orderNum.textContent   = orderNum;
    els.feedback.textContent   = '';
    els.feedback.className     = '';
    els.serveBtn.style.display = '';
    els.nextBtn.style.display  = 'none';
    document.querySelectorAll('.ctrl-card').forEach(c => c.classList.remove('highlight'));
    updateTicket();
    updateControls();
    updateCup(true);
  } else {
    newOrder();
  }
});

// ─── NEW ORDER ────────────────────────────────────────────────────────────────
function newOrder() {
  orderNum++;
  orderDone = false;

  // Reset player
  INGREDIENTS.forEach(k => { current[k] = 0; denom[k] = MAX_EACH; });

  // Generate target (ensure total >= 2, each 0-MAX_EACH)
  do {
    INGREDIENTS.forEach(k => {
      target[k] = Math.floor(Math.random() * (MAX_EACH + 1));
    });
  } while (INGREDIENTS.reduce((s, k) => s + target[k], 0) < 2);

  // UI resets
  els.orderNum.textContent = orderNum;
  els.feedback.textContent = '';
  els.feedback.className   = '';
  els.serveBtn.style.display = '';
  els.nextBtn.style.display  = 'none';
  // Disable/enable cards
  document.querySelectorAll('.ctrl-card').forEach(c => c.classList.remove('highlight'));

  updateTicket();
  updateControls();
  updateCup(true);
}
window.newOrder = newOrder;

// ─── CHANGE INGREDIENT ───────────────────────────────────────────────────────
function change(ing, delta) {
  if (orderDone) return;
  current[ing] = Math.max(0, Math.min(denom[ing], current[ing] + delta));

  // Ripple effect on card
  const card = document.querySelector(`.ctrl-card[data-ing="${ing}"]`);
  if (card) {
    card.classList.remove('highlight');
    void card.offsetWidth;
    card.classList.add('highlight');
  }

  updateControls();
  updateCup(false);
}
window.change = change;

// ─── SERVE / SUBMIT ───────────────────────────────────────────────────────────
function sendOrder() {
  if (orderDone) return;
  orderDone = true;

  const correct = INGREDIENTS.every(k => current[k] === target[k]);

  if (correct) {
    els.feedback.textContent   = '🌟 Good Job!';
    els.feedback.className     = 'good';
    score.correct++;
    if (els.sCorrect) els.sCorrect.textContent = score.correct;
    celebrateCup();
    // Hide both buttons — we're navigating away, don't allow Next Order
    els.serveBtn.style.display = 'none';
    els.nextBtn.style.display  = 'none';
    setTimeout(() => { window.location.href = 'scene_3.html'; }, 1800);
  } else {
    els.feedback.textContent = '❌ Wrong Recipe!';
    els.feedback.className   = 'bad';
    score.wrong++;
    if (els.sWrong) els.sWrong.textContent = score.wrong;
    shakeCup();
    highlightTicketRows();
    // Unlock so the player can fix their answer and re-serve
    orderDone = false;
    els.serveBtn.style.display = '';
  }
}
window.sendOrder = sendOrder;

// ─── TICKET ──────────────────────────────────────────────────────────────────
function updateTicket() {
  INGREDIENTS.forEach(ing => {
    const container = el(`tb-${ing}`);
    container.innerHTML = '';
    const d = denom[ing];
    const t = target[ing];
    for (let i = 0; i < d; i++) {
      const dot = document.createElement('span');
      dot.className = `ticket-dot ${i < t ? ing : 'empty'}`;
      container.appendChild(dot);
    }
    const row = document.querySelector(`.ticket-row[data-ing="${ing}"]`);
    if (row) row.classList.remove('match', 'miss');
  });
}

function highlightTicketRows() {
  INGREDIENTS.forEach(ing => {
    const row = document.querySelector(`.ticket-row[data-ing="${ing}"]`);
    if (!row) return;
    if (current[ing] === target[ing]) {
      row.classList.add('match');
    }
    // classList.add('') throws a DOMException — never pass an empty string
  });
}

// ─── CONTROLS ────────────────────────────────────────────────────────────────
function updateControls() {
  INGREDIENTS.forEach(ing => {
    el(`v-${ing}`).textContent = `${current[ing]}/${denom[ing]}`;
    const dotsEl = el(`d-${ing}`);
    dotsEl.innerHTML = '';
    const d = denom[ing];
    for (let i = 0; i < d; i++) {
      const dot = document.createElement('span');
      dot.className = `step-dot ${i < current[ing] ? `${ing} filled` : 'empty'}`;
      dotsEl.appendChild(dot);
    }
  });
}

// ─── CUP FILL ─────────────────────────────────────────────────────────────────
function updateCup(instant) {
  const fillable = CUP_INNER_H * 0.88;

  // Each ingredient's slice = its fraction of the whole cup (current/denom)
  // When all match targets, total fill = sum of all fractions = 1.0 (full cup)
  let cumY = CUP_BOTTOM;

  INGREDIENTS.forEach(ing => {
    const frac = current[ing] / denom[ing];
    const h    = frac * fillable;
    const rect = el(`fill-${ing}`);
    if (instant) {
      // Skip CSS transition for instant reset
      rect.style.transition = 'none';
      rect.setAttribute('y', cumY - h);
      rect.setAttribute('height', h);
      void rect.getBoundingClientRect();
      rect.style.transition = '';
    } else {
      rect.setAttribute('y', cumY - h);
      rect.setAttribute('height', h);
    }
    cumY -= h;
  });

  // Liquid surface indicator — total fill as fraction of full cup
  const fillRatio = INGREDIENTS.reduce((s, k) => s + current[k] / denom[k], 0);
  const surfaceBottom = 16 + (1 - fillRatio) * (CUP_INNER_H * 0.88);
  els.surface.style.bottom  = surfaceBottom + 'px';
  els.surface.style.opacity = fillRatio > 0 ? '1' : '0';

  // Straw appears when there's liquid
  const recipeMatch = INGREDIENTS.every(k => current[k] === target[k]);
  els.straw.style.opacity = recipeMatch ? '0.92' : '0';

  // Decorative ice cubes visible when ice > 1
  els.iceCubes.style.opacity = current.ice > 1 ? '0.85' : '0';

  // Lemon slice visible when lemon > 0
  els.lemonSlice.style.opacity = current.lemon > 0 ? '0.9' : '0';

  // Bubbles
  manageBubbles(fillRatio);
}

// ─── BUBBLES ──────────────────────────────────────────────────────────────────
function manageBubbles(fillRatio) {
  if (fillRatio < 0.05) {
    stopBubbles();
    return;
  }
  if (!bubbleID) startBubbles(fillRatio);
}

function startBubbles(fillRatio) {
  const interval = Math.max(300, 900 - fillRatio * 600);
  bubbleID = setInterval(() => spawnBubble(fillRatio), interval);
}

function stopBubbles() {
  if (bubbleID) { clearInterval(bubbleID); bubbleID = null; }
  els.bubbleGrp.innerHTML = '';
}

function spawnBubble(fillRatio) {
  const fr = INGREDIENTS.reduce((s, k) => s + current[k] / denom[k], 0);

  const svgNS = 'http://www.w3.org/2000/svg';
  const circle = document.createElementNS(svgNS, 'circle');
  const x  = 35 + Math.random() * 90;
  const y0 = CUP_BOTTOM - (fr * CUP_INNER_H * 0.88) + 4;
  const r  = 2 + Math.random() * 4;
  circle.setAttribute('cx', x);
  circle.setAttribute('cy', y0);
  circle.setAttribute('r', r);
  circle.setAttribute('fill', 'rgba(255,255,255,0.55)');
  circle.setAttribute('filter', 'url(#bubble-blur)');

  els.bubbleGrp.appendChild(circle);

  // Animate upward
  const riseH = 20 + Math.random() * 40;
  let start = null;
  const duration = 600 + Math.random() * 600;

  function step(ts) {
    if (!start) start = ts;
    const prog = Math.min((ts - start) / duration, 1);
    const newY  = y0 - prog * riseH;
    const alpha = 0.55 * (1 - prog);
    circle.setAttribute('cy', newY);
    circle.setAttribute('fill', `rgba(255,255,255,${alpha.toFixed(2)})`);
    if (prog < 1) requestAnimationFrame(step);
    else circle.remove();
  }
  requestAnimationFrame(step);
}

// ─── CUP ANIMATIONS ───────────────────────────────────────────────────────────
function celebrateCup() {
  const wrap = document.getElementById('cup-wrap');
  wrap.style.animation = 'none';
  void wrap.offsetWidth;
  wrap.style.animation = 'cupBounce 0.5s ease';

  // Inject bounce keyframes if not already
  if (!document.getElementById('bounce-style')) {
    const s = document.createElement('style');
    s.id = 'bounce-style';
    s.textContent = `
      @keyframes cupBounce {
        0%   { transform: translateY(0) rotate(0deg); }
        25%  { transform: translateY(-12px) rotate(-3deg); }
        50%  { transform: translateY(-6px) rotate(3deg); }
        75%  { transform: translateY(-3px) rotate(-1deg); }
        100% { transform: translateY(0) rotate(0deg); }
      }
      @keyframes cupShake {
        0%,100% { transform: translateX(0); }
        15%     { transform: translateX(-8px) rotate(-4deg); }
        30%     { transform: translateX(8px)  rotate(4deg); }
        45%     { transform: translateX(-5px) rotate(-2deg); }
        60%     { transform: translateX(5px)  rotate(2deg); }
        80%     { transform: translateX(-2px); }
      }
    `;
    document.head.appendChild(s);
  }
}

function shakeCup() {
  const wrap = document.getElementById('cup-wrap');
  wrap.style.animation = 'none';
  void wrap.offsetWidth;
  wrap.style.animation = 'cupShake 0.5s ease';
  if (!document.getElementById('bounce-style')) celebrateCup(); // ensure keyframes exist
}

// ─── (timer removed — driven by shared timer.js) ─────────────────────────────

// ─── DECORATIVE FLOATING LEMONS ───────────────────────────────────────────────
function spawnDecoLemons() {
  const container = el('deco-container');
  const emojis    = ['🍋', '🍋', '🍋', '💛', '⭐'];
  const count     = 8;

  for (let i = 0; i < count; i++) {
    const lemon = document.createElement('div');
    lemon.className = 'float-lemon';
    lemon.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    lemon.style.left     = (5 + Math.random() * 90) + 'vw';
    lemon.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
    const dur = 12 + Math.random() * 18;
    lemon.style.animationDuration = dur + 's';
    lemon.style.animationDelay   = -(Math.random() * dur) + 's';
    container.appendChild(lemon);
  }
}