// cutscene.js — auto-advances to the next scene after a delay
// Each page sets data-next on <body> to declare where to go.

document.addEventListener('DOMContentLoaded', () => {
  const next = document.body.dataset.next;
  if (next) {
    setTimeout(() => { window.location.href = next; }, 4000); // 4 s per scene
  }
});
