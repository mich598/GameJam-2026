// audio.js — seamless looping background music across all pages
//
// Saves both the playback position AND a wall-clock timestamp on every page exit.
// The next page adds the elapsed transition time to the resume position, so the
// audio restarts at exactly the right spot — virtually eliminating the gap.

(function () {
  // shell.html owns the audio — don't create a second player inside the iframe
  if (window !== window.top) return;

  const SRC    = 'universfield-bright-piano-fun-270899.mp3';
  const VOLUME = 0.6;

  const bgm  = new Audio(SRC);
  bgm.loop   = true;
  bgm.volume = VOLUME;

  // ── Calculate where to resume ──────────────────────────────────────────────
  const savedPos  = parseFloat(localStorage.getItem('bgmPos')    || '0');
  const savedAt   = parseInt  (localStorage.getItem('bgmSavedAt') || '0');

  // Time elapsed while the browser was navigating to this page
  const transitMs = savedAt > 0 ? Date.now() - savedAt : 0;
  let   resumeAt  = savedPos + transitMs / 1000;

  // Clamp to track duration once metadata is available (handles loop wrap-around)
  function applyResumeTime() {
    if (bgm.duration && bgm.duration > 0) {
      bgm.currentTime = resumeAt % bgm.duration;
    } else if (resumeAt > 0) {
      bgm.currentTime = resumeAt; // best guess before duration is known
    }
  }

  if (bgm.readyState >= 1) {
    applyResumeTime();
  } else {
    bgm.addEventListener('loadedmetadata', applyResumeTime, { once: true });
  }

  // ── Save position on every page exit ───────────────────────────────────────
  function savePosition() {
    localStorage.setItem('bgmPos',     bgm.currentTime.toFixed(3));
    localStorage.setItem('bgmSavedAt', Date.now().toString());
  }

  window.addEventListener('pagehide',    savePosition);
  window.addEventListener('beforeunload', savePosition);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') savePosition();
  });

  // Only resume if the user has explicitly turned music on before
  if (localStorage.getItem('musicMuted') === 'false') {
    bgm.play().catch(() => {});
  }

  // Exposed for pages run outside shell
  window.toggleBGM = function () {
    if (bgm.paused) {
      bgm.play().catch(() => {});
      localStorage.setItem('musicMuted', 'false');
      return false;
    } else {
      bgm.pause();
      localStorage.setItem('musicMuted', 'true');
      return true;
    }
  };
})();
