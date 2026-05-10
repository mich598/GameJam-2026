// bank.js — animated savings screen
// Coins fall into the jar, the counter ticks up, the bar fills, then the verdict appears.

// ── Change this ONE line to update the bike price ──
const BIKE_COST = 13.00;

const ANIM_MS = 2600; // total duration of the fill/count animation

// ── Canvas scaling — same approach as all other scenes ───────────────────────
function scaleCanvas() {
  const scale  = Math.min(window.innerWidth / 1366, window.innerHeight / 630);
  const canvas = document.getElementById('bank-canvas');
  if (canvas) canvas.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', scaleCanvas);
window.visualViewport?.addEventListener('resize', scaleCanvas);

// ── Main entry ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  scaleCanvas();

  const earned = parseFloat(localStorage.getItem('earnings') || '0');
  const pct    = Math.min(earned / BIKE_COST * 100, 100);

  // Update goal price label
  document.getElementById('goal-price').textContent = `$${BIKE_COST.toFixed(2)}`;

  // Brief pause so the card slide-in finishes before animating
  setTimeout(() => {
    animateBar(pct);
    animateJar(pct);
    animateCounter(earned);
    dropCoins(earned);
    setTimeout(() => showVerdict(earned), ANIM_MS + 300);
  }, 500);
});

// ── Smooth ease-out counter ──────────────────────────────────────────────────
function animateCounter(target) {
  const startTime  = performance.now();
  const amountEl   = document.getElementById('jar-amount');
  const labelEl    = document.getElementById('progress-label');

  function tick(now) {
    const t      = Math.min((now - startTime) / ANIM_MS, 1);
    const eased  = 1 - Math.pow(1 - t, 3);          // ease-out cubic
    const value  = target * eased;

    amountEl.textContent = `$${value.toFixed(2)}`;
    labelEl.textContent  = `$${value.toFixed(2)} / $${BIKE_COST.toFixed(2)}`;

    if (t < 1) requestAnimationFrame(tick);
    else {
      amountEl.textContent = `$${target.toFixed(2)}`;
      labelEl.textContent  = `$${target.toFixed(2)} / $${BIKE_COST.toFixed(2)}`;
    }
  }
  requestAnimationFrame(tick);
}

// ── Bar fill ─────────────────────────────────────────────────────────────────
function animateBar(pct) {
  const fill = document.getElementById('progress-fill');
  fill.style.transition = `width ${ANIM_MS}ms cubic-bezier(0.2, 0, 0.2, 1)`;
  // Force reflow so transition triggers from 0
  void fill.offsetWidth;
  fill.style.width = pct + '%';
}

// ── Jar fill ─────────────────────────────────────────────────────────────────
function animateJar(pct) {
  const fill = document.getElementById('jar-fill');
  fill.style.transition = `height ${ANIM_MS}ms cubic-bezier(0.2, 0, 0.2, 1)`;
  void fill.offsetWidth;
  fill.style.height = pct + '%';
}

// ── Coins raining into the jar ───────────────────────────────────────────────
function dropCoins(earned) {
  // More coins the more money saved, between 5 and 20
  const count = Math.max(5, Math.min(Math.ceil(earned / 2.5), 20));
  const zone  = document.getElementById('coin-zone');
  const gap   = ANIM_MS / count;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const coin = document.createElement('div');
      coin.className = 'falling-coin';
      // Spread coins across the jar width
      coin.style.left            = (8 + Math.random() * 70) + '%';
      coin.style.animationDuration = (0.35 + Math.random() * 0.25) + 's';
      zone.appendChild(coin);
      setTimeout(() => coin.remove(), 700);
    }, i * gap);
  }
}

// ── Final verdict — then auto-navigate to the cutscene ────────────────────────
function showVerdict(earned) {
  const msg       = document.getElementById('status-msg');
  const remaining = Math.max(0, BIKE_COST - earned);

  if (earned >= BIKE_COST) {
    msg.textContent = '🎉 You have enough — go buy that bike!';
    msg.className   = 'status-msg congrats show';
    launchConfetti();
    setTimeout(() => { window.location.href = 'bike_win_final.html'; }, 3000);
  } else {
    msg.textContent = `$${remaining.toFixed(2)} still needed…`;
    msg.className   = 'status-msg info show';
    setTimeout(() => { window.location.href = 'bike_lose_final.html'; }, 3000);
  }
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function launchConfetti() {
  const colours = ['#F5C518','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD'];
  for (let i = 0; i < 60; i++) {
    const piece    = document.createElement('div');
    piece.className = 'confetti-piece';
    const dur      = 0.9 + Math.random() * 1.4;
    const delay    = Math.random() * 0.5;
    piece.style.cssText = `
      left: ${Math.random() * 100}vw;
      top: -20px;
      background: ${colours[i % colours.length]};
      width: ${6 + Math.random() * 8}px;
      height: ${8 + Math.random() * 10}px;
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), (dur + delay) * 1000 + 200);
  }
}
