// timer.js — shared 3-minute happiness timer + pause system across all scenes

const TIMER_TOTAL = 180; // 3 minutes

function getSatRemaining() {
  const start = parseInt(localStorage.getItem('gameStartTime') || Date.now());
  if (localStorage.getItem('gamePaused')) {
    // Timer is frozen — measure up to the moment we paused
    const frozenAt = parseInt(localStorage.getItem('pauseStartTime') || Date.now());
    return Math.max(0, TIMER_TOTAL - Math.floor((frozenAt - start) / 1000));
  }
  return Math.max(0, TIMER_TOTAL - Math.floor((Date.now() - start) / 1000));
}

function updateSatPanel() {
  const remaining = getSatRemaining();
  const pct       = remaining / TIMER_TOTAL;

  const face = document.getElementById('sat-face');
  const fill = document.getElementById('sat-bar-fill');
  const time = document.getElementById('sat-time');
  if (!face || !fill || !time) return;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  time.textContent = `${mins}:${String(secs).padStart(2, '0')}`;

  if      (pct > 0.65) face.textContent = '😄';
  else if (pct > 0.40) face.textContent = '😐';
  else if (pct > 0.20) face.textContent = '😢';
  else                 face.textContent = '😠';

  fill.style.height = (pct * 100) + '%';
  if (pct > 0.55) {
    fill.style.background = 'linear-gradient(to top, #2e7d32, #66bb6a)';
  } else if (pct > 0.28) {
    fill.style.background = 'linear-gradient(to top, #e65100, #ff9800)';
  } else {
    fill.style.background = 'linear-gradient(to top, #b71c1c, #ef5350)';
  }
}

// ── Pause / Resume ──────────────────────────────────────────────────────────

function pauseGame() {
  if (localStorage.getItem('gamePaused')) return;
  localStorage.setItem('gamePaused', 'true');
  localStorage.setItem('pauseStartTime', Date.now().toString());
  const overlay = document.getElementById('pause-overlay');
  const btn     = document.getElementById('pause-btn');
  if (overlay) overlay.hidden = false;
  if (btn)     btn.textContent = '▶';
}

function resumeGame() {
  const pauseStart = parseInt(localStorage.getItem('pauseStartTime') || Date.now());
  const pausedMs   = Date.now() - pauseStart;
  const gameStart  = parseInt(localStorage.getItem('gameStartTime') || Date.now());
  localStorage.setItem('gameStartTime', (gameStart + pausedMs).toString());
  localStorage.removeItem('gamePaused');
  localStorage.removeItem('pauseStartTime');
  const overlay = document.getElementById('pause-overlay');
  const btn     = document.getElementById('pause-btn');
  if (overlay) overlay.hidden = true;
  if (btn)     btn.textContent = '⏸';
  updateSatPanel();
}

// ── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // If the page loaded while paused (e.g. refresh mid-pause), resume cleanly
  if (localStorage.getItem('gamePaused')) resumeGame();
  updateSatPanel();
  setInterval(updateSatPanel, 1000);
});
