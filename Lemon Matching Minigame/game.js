/* ═══════════════════════════════════════════════
   TIMMY'S LEMON MEMORY — game.js
   9-card memory grid: 4 pairs + 1 special card
   Cards: 2× single lemon, 1× triple lemon, 1× bad lemon, 1× money (special)
═══════════════════════════════════════════════ */

'use strict';

// ─── CARD DEFINITIONS ─────────────────────────────────────────────────────────
// 4 pairs = 8 cards, 1 special = 9 total
const PAIR_TYPES = [
  { id: 'lemon',  emoji: '🍋',       label: 'Lemon',   count: 2 }, // Lemon
  { id: 'sugar', emoji: '🍬',     label: 'Sugar',   count: 2 }, // Sugar
  { id: 'ice',  emoji: '🧊',   label: 'Ice',  count: 2 }, // Ice
  { id: 'water',  emoji: '💧',       label: 'Water', count: 2 }, // Water
];
const SPECIAL = { id: 'money', emoji: '💰', label: '+$3 Bonus!', special: true };

// ─── STATE ────────────────────────────────────────────────────────────────────
let lives        = 3;
let piggyMoney   = 0;
let flippedCards = [];   // up to 2 cards currently face-up (unmatched)
let matchedIds   = new Set();
let lockBoard    = false;
let totalPairs   = 4;
let pairsFound   = 0;
let specialFound = false;

// ─── DOM HELPERS ──────────────────────────────────────────────────────────────
const el = id => document.getElementById(id);

// ─── INIT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  spawnDecoLemons();
  buildBoard();
});

// ─── BUILD BOARD ──────────────────────────────────────────────────────────────
function buildBoard() {
  // Assemble 9 card data items: 8 pair cards + 1 special
  const cards = [];
  PAIR_TYPES.forEach(type => {
    for (let i = 0; i < type.count; i++) {
      cards.push({ id: type.id, emoji: type.emoji, label: type.label, special: false });
    }
  });
  cards.push({ ...SPECIAL });

  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  const board = el('board');
  board.innerHTML = '';

  cards.forEach((data, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.idx  = idx;
    card.dataset.id   = data.id;
    card.dataset.special = data.special ? '1' : '0';

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-back"></div>
        <div class="card-front">
          <span class="card-emoji">${data.emoji}</span>
          <span class="card-label">${data.label}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => onCardClick(card));
    board.appendChild(card);
  });
}

// ─── CARD CLICK ───────────────────────────────────────────────────────────────
function onCardClick(card) {
  if (lockBoard) return;
  if (card.classList.contains('flipped')) return;
  if (card.classList.contains('matched')) return;
  if (card.classList.contains('disabled')) return;

  flipCard(card);
  flippedCards.push(card);

  if (card.dataset.special === '1') {
    // Special card — award money immediately, stay revealed
    handleSpecial(card);
    flippedCards = flippedCards.filter(c => c !== card);
    return;
  }

  if (flippedCards.length === 2) {
    lockBoard = true;
    checkMatch();
  }
}

function flipCard(card) {
  card.classList.add('flipped');
}

function unflipCard(card) {
  card.classList.remove('flipped');
}

// ─── CHECK MATCH ──────────────────────────────────────────────────────────────
function checkMatch() {
  const [a, b] = flippedCards;
  const isMatch = a.dataset.id === b.dataset.id;

  if (isMatch) {
    // Mark matched
    setTimeout(() => {
      a.classList.add('matched');
      b.classList.add('matched');
      burstEffect(a);
      burstEffect(b);
      pairsFound++;
      flippedCards = [];
      lockBoard = false;
      checkWin();
    }, 500);
  } else {
    // Wrong — lose a life, shake, flip back
    setTimeout(() => {
      loseLife();
      shakeBoard();
      setTimeout(() => {
        unflipCard(a);
        unflipCard(b);
        flippedCards = [];
        lockBoard = false;
        if (lives <= 0) showGameOver();
      }, 600);
    }, 700);
  }
}

// ─── SPECIAL CARD ─────────────────────────────────────────────────────────────
function handleSpecial(card) {
  card.classList.add('matched', 'special');
  specialFound = true;
  piggyMoney += 3;
  updatePiggy(true);
  showCoinPop(card, '+$3');
  checkWin();
}

// ─── LOSE A LIFE ──────────────────────────────────────────────────────────────
function loseLife() {
  lives = Math.max(0, lives - 1);
  updateHearts();
}

function updateHearts() {
  for (let i = 1; i <= 3; i++) {
    const heart = el(`heart-${i}`);
    if (i > lives) heart.classList.add('lost');
    else heart.classList.remove('lost');
  }
}

// ─── PIGGY BANK ───────────────────────────────────────────────────────────────
function updatePiggy(animate) {
  el('piggy-value').textContent = piggyMoney;
  if (animate) {
    const icon = el('piggy-icon');
    icon.classList.remove('bounce');
    void icon.offsetWidth;
    icon.classList.add('bounce');
  }
}

// ─── BOARD SHAKE ──────────────────────────────────────────────────────────────
function shakeBoard() {
  const wrap = el('board-wrap');
  wrap.classList.remove('shake');
  void wrap.offsetWidth;
  wrap.classList.add('shake');
  wrap.addEventListener('animationend', () => wrap.classList.remove('shake'), { once: true });
}

// ─── BURST EFFECT (match stars) ───────────────────────────────────────────────
function burstEffect(card) {
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  const emojis = ['✨','⭐','🌟','💛'];
  for (let i = 0; i < 5; i++) {
    const burst = document.createElement('div');
    burst.className = 'match-burst';
    burst.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = (i / 5) * Math.PI * 2;
    const dist  = 55 + Math.random() * 35;
    burst.style.left = cx + 'px';
    burst.style.top  = cy + 'px';
    burst.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    burst.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    burst.style.animationDelay = (i * 50) + 'ms';
    document.body.appendChild(burst);
    burst.addEventListener('animationend', () => burst.remove());
  }
}

// ─── COIN POP ─────────────────────────────────────────────────────────────────
function showCoinPop(card, text) {
  const rect = card.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'coin-pop';
  pop.textContent = text;
  pop.style.left = (rect.left + rect.width / 2 - 20) + 'px';
  pop.style.top  = (rect.top) + 'px';
  document.body.appendChild(pop);
  pop.addEventListener('animationend', () => pop.remove());
}

// ─── WIN / LOSS CHECK ─────────────────────────────────────────────────────────
function checkWin() {
  if (pairsFound >= totalPairs && specialFound) {
    setTimeout(showWin, 600);
  } else if (pairsFound >= totalPairs) {
    // All pairs found but maybe not special — still win if all 8 pair cards matched
    setTimeout(showWin, 600);
  }
}

function showWin() {
  el('overlay-emoji').textContent = '🥳';
  el('overlay-title').textContent = 'Hooray!';
  el('overlay-sub').textContent   = `Timmy can make lemonade again! 🍋\nPiggy Bank: $${piggyMoney}`;
  el('overlay').classList.remove('hidden');
}

function showGameOver() {
  el('overlay-emoji').textContent = '😭';
  el('overlay-title').textContent = 'NOOO!';
  el('overlay-sub').textContent   = `We lost the lemons!\nPiggy Bank: $${piggyMoney}`;
  el('overlay').classList.remove('hidden');
}

// ─── RESTART ──────────────────────────────────────────────────────────────────
function restartGame() {
  lives        = 3;
  piggyMoney   = 0;
  flippedCards = [];
  matchedIds   = new Set();
  lockBoard    = false;
  pairsFound   = 0;
  specialFound = false;

  updateHearts();
  updatePiggy(false);
  el('overlay').classList.add('hidden');
  buildBoard();
}
window.restartGame = restartGame;

// ─── FLOATING DECO ────────────────────────────────────────────────────────────
function spawnDecoLemons() {
  const container = el('deco-container');
  const emojis = ['🍋', '🍋', '🍋', '💛', '⭐'];
  for (let i = 0; i < 7; i++) {
    const lemon = document.createElement('div');
    lemon.className = 'float-lemon';
    lemon.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    lemon.style.left     = (5 + Math.random() * 90) + 'vw';
    lemon.style.fontSize = (0.9 + Math.random() * 1.2) + 'rem';
    const dur = 14 + Math.random() * 18;
    lemon.style.animationDuration = dur + 's';
    lemon.style.animationDelay   = -(Math.random() * dur) + 's';
    container.appendChild(lemon);
  }
}
