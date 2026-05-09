// audio.js — looping background music across all pages
// Saves playback position so the track resumes after page transitions.

(function () {
  const SRC    = 'universfield-bright-piano-fun-270899.mp3';
  const VOLUME = 0.35;

  const bgm = new Audio(SRC);
  bgm.loop   = true;
  bgm.volume = VOLUME;

  // Resume from saved position
  const saved = parseFloat(localStorage.getItem('bgmTime') || '0');
  if (saved > 0) bgm.currentTime = saved;

  // Persist position every second
  setInterval(() => {
    if (!bgm.paused) localStorage.setItem('bgmTime', bgm.currentTime.toFixed(2));
  }, 1000);

  // Persist on unload so the next page can pick up immediately
  window.addEventListener('beforeunload', () => {
    localStorage.setItem('bgmTime', bgm.currentTime.toFixed(2));
  });

  function startMusic() {
    bgm.play().catch(() => {});
  }

  // Attempt autoplay; if blocked, start on the first user interaction
  document.addEventListener('DOMContentLoaded', () => {
    bgm.play().catch(() => {
      document.addEventListener('pointerdown', startMusic, { once: true });
      document.addEventListener('keydown',     startMusic, { once: true });
    });
  });
})();
