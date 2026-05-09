/* ═══════════════════════════════════════════════
   LEMONADE STAND — game.js
   Full game logic: orders, cup fills, timer, scoring
═══════════════════════════════════════════════ */

'use strict';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const INGREDIENTS = ['water', 'ice', 'sugar', 'lemon'];
const MAX_EACH    = 4;      // max units of each ingredient
const TIMER_START = 30;     // seconds per order
const CUP_INNER_H = 196;    // usable SVG height inside cup (px)
const CUP_BOTTOM  = 214;    // SVG y for cup base

// ─── STATE ───────────────────────────────────────────────────────────────────
let current    = { water: 0, ice: 0, sugar: 0, lemon: 0 };
let target     = { water: 0, ice: 0, sugar: 0, lemon: 0 };
let score      = { correct: 0, wrong: 0 };
let orderNum   = 0;
let timerVal   = TIMER_START;
let timerID    = null;
let orderDone  = false;
let bubbleID   = null;

// ─── ELEMENT CACHE ───────────────────────────────────────────────────────────
const el = id => document.getElementById(id);

const els = {
  feedback:   el('feedback'),
  orderNum:   el('order-num'),
  serveBtn:   el('serve-btn'),
  nextBtn:    el('next-btn'),
  satFace:    el('sat-face'),
  satFill:    el('sat-bar-fill'),
  satTime:    el('sat-time'),
  sCorrect:   el('s-correct'),
  sWrong:     el('s-wrong'),
  surface:    el('liquid-surface'),
  straw:      el('straw'),
  iceCubes:   el('ice-cubes'),
  lemonSlice: el('lemon-slice'),
  bubbleGrp:  el('bubble-group'),
};

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  spawnDecoLemons();
  newOrder();
});

// ─── NEW ORDER ────────────────────────────────────────────────────────────────
function newOrder() {
  orderNum++;
  orderDone = false;

  // Reset player
  INGREDIENTS.forEach(k => { current[k] = 0; });

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
  resetTimer();
}
window.newOrder = newOrder;

// ─── CHANGE INGREDIENT ───────────────────────────────────────────────────────
function change(ing, delta) {
  if (orderDone) return;
  current[ing] = Math.max(0, Math.min(MAX_EACH, current[ing] + delta));

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
  stopTimer();

  const correct = INGREDIENTS.every(k => current[k] === target[k]);

  if (correct) {
    els.feedback.textContent = '🌟 Good Job!';
    els.feedback.className   = 'good';
    score.correct++;
    celebrateCup();
  } else {
    els.feedback.textContent = '❌ Wrong Recipe!';
    els.feedback.className   = 'bad';
    score.wrong++;
    shakeCup();
    // Show correct vs wrong on ticket
    highlightTicketRows();
  }

  els.sCorrect.textContent = score.correct;
  els.sWrong.textContent   = score.wrong;
  els.serveBtn.style.display = 'none';
  els.nextBtn.style.display  = '';
}
window.sendOrder = sendOrder;

// ─── TICKET ──────────────────────────────────────────────────────────────────
function updateTicket() {
  INGREDIENTS.forEach(ing => {
    const container = el(`tb-${ing}`);
    container.innerHTML = '';
    for (let i = 0; i < MAX_EACH; i++) {
      const dot = document.createElement('span');
      dot.className = `ticket-dot ${i < target[ing] ? ing : 'empty'}`;
      container.appendChild(dot);
    }
    // Reset row style
    const row = document.querySelector(`.ticket-row[data-ing="${ing}"]`);
    if (row) row.classList.remove('match', 'miss');
  });
}

function highlightTicketRows() {
  INGREDIENTS.forEach(ing => {
    const row = document.querySelector(`.ticket-row[data-ing="${ing}"]`);
    if (row) {
      row.classList.add(current[ing] === target[ing] ? 'match' : '');
    }
  });
}

// ─── CONTROLS ────────────────────────────────────────────────────────────────
function updateControls() {
  INGREDIENTS.forEach(ing => {
    el(`v-${ing}`).textContent = current[ing];
    const dotsEl = el(`d-${ing}`);
    dotsEl.innerHTML = '';
    for (let i = 0; i < MAX_EACH; i++) {
      const dot = document.createElement('span');
      dot.className = `step-dot ${i < current[ing] ? `${ing} filled` : 'empty'}`;
      dotsEl.appendChild(dot);
    }
  });
}

// ─── CUP FILL ─────────────────────────────────────────────────────────────────
function updateCup(instant) {
  const totalMax = MAX_EACH * INGREDIENTS.length;   // 16
  const totalCur = INGREDIENTS.reduce((s, k) => s + current[k], 0);
  const fillable = CUP_INNER_H * 0.88; // leave a little head room

  // Layers render bottom → top: water, ice, sugar, lemon
  // We stack them from bottom of cup (y=CUP_BOTTOM)
  let cumY = CUP_BOTTOM;

  INGREDIENTS.forEach(ing => {
    const frac = totalMax > 0 ? current[ing] / totalMax : 0;
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

  // Liquid surface indicator
  const fillRatio = totalCur / totalMax;
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
  const totalMax = MAX_EACH * INGREDIENTS.length;
  const totalCur = INGREDIENTS.reduce((s, k) => s + current[k], 0);
  const fr = totalCur / totalMax;

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

// ─── TIMER ───────────────────────────────────────────────────────────────────
function resetTimer() {
  stopTimer();
  timerVal = TIMER_START;
  updateSatBar();
  timerID = setInterval(tickTimer, 1000);
}

function stopTimer() {
  if (timerID) { clearInterval(timerID); timerID = null; }
}

function tickTimer() {
  timerVal = Math.max(0, timerVal - 1);
  updateSatBar();
  if (timerVal === 0 && !orderDone) {
    timeExpired();
  }
}

function timeExpired() {
  orderDone = true;
  stopTimer();
  els.feedback.textContent = '⏰ Time\'s Up!';
  els.feedback.className   = 'bad';
  score.wrong++;
  els.sWrong.textContent   = score.wrong;
  shakeCup();
  highlightTicketRows();
  els.serveBtn.style.display = 'none';
  els.nextBtn.style.display  = '';
}

function updateSatBar() {
  const pct = timerVal / TIMER_START;
  els.satFill.style.height = (pct * 100) + '%';
  els.satTime.textContent  = timerVal + 's';

  // Face
  if (pct > 0.65)      els.satFace.textContent = '😄';
  else if (pct > 0.40) els.satFace.textContent = '😐';
  else if (pct > 0.20) els.satFace.textContent = '😢';
  else                 els.satFace.textContent = '😠';

  // Bar color
  if (pct > 0.55) {
    els.satFill.style.background = 'linear-gradient(to top, #2e7d32, #66bb6a)';
  } else if (pct > 0.28) {
    els.satFill.style.background = 'linear-gradient(to top, #e65100, #ff9800)';
  } else {
    els.satFill.style.background = 'linear-gradient(to top, #b71c1c, #ef5350)';
  }
}

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
