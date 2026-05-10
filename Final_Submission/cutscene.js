// cutscene.js — auto-advances to the next scene after a delay
// Each page sets data-next on <body> to declare where to go.

document.addEventListener('DOMContentLoaded', () => {
  const next = document.body.dataset.next;
  if (next) {
    setTimeout(() => { window.location.href = next; }, 4000);
  }

  // Lock play-again button (and any other fixed UI) against zoom
  function scaleBtn() {
    const btn = document.getElementById('play-again-btn');
    if (!btn) return;
    const s = Math.min(window.innerWidth / 1366, window.innerHeight / 630);
    btn.style.transform       = `translateX(-50%) scale(${s})`;
    btn.style.transformOrigin = 'bottom center';
  }
  window.addEventListener('resize', scaleBtn);
  window.visualViewport?.addEventListener('resize', scaleBtn);
  scaleBtn();
});
