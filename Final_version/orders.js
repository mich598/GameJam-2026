// orders.js
// Generates lemonade orders where ice + lemon + sugar + water = exactly 1
// Fractions can have DIFFERENT denominators in the same order
// Order text uses words — "one quarter" not "1/4"

// --- Maths helpers ---

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function simplify(n, d) {
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

// Split whole number `total` into `count` positive integers using random cut points
function randomPartition(total, count) {
  const cuts = new Set();
  while (cuts.size < count - 1) {
    cuts.add(Math.floor(Math.random() * (total - 1)) + 1);
  }
  const sorted = [...cuts].sort((a, b) => a - b);
  const parts = [];
  let prev = 0;
  for (const c of sorted) { parts.push(c - prev); prev = c; }
  parts.push(total - prev);
  return parts;
}

// --- Fraction → words ---

const NUMS = [
  '', 'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten'
];

const DENOM_SINGLE = [
  '', '', 'half', 'third', 'quarter', 'fifth',
  'sixth', 'seventh', 'eighth', 'ninth', 'tenth'
];

const DENOM_PLURAL = [
  '', '', 'halves', 'thirds', 'quarters', 'fifths',
  'sixths', 'sevenths', 'eighths', 'ninths', 'tenths'
];

function toWords(fracStr) {
  const [n, d] = fracStr.split('/').map(Number);
  const denomWord = n === 1 ? DENOM_SINGLE[d] : DENOM_PLURAL[d];
  return `${NUMS[n]} ${denomWord}`;
}

// --- Order generation ---

// LCDs chosen so simplified fractions have different denominators in the same order
// 6  → can produce denoms 2, 3, 6
// 8  → can produce denoms 2, 4, 8
// 10 → can produce denoms 2, 5, 10
// 12 → can produce denoms 2, 3, 4, 6  (retried if any part=1 gives denom 12)
const LCDS = [6, 8, 10, 12];

const TEMPLATES = [
  (i, l, s, w) => `Hi! I'd like ${i} ice, ${l} lemon, ${s} sugar and ${w} water please!`,
  (i, l, s, w) => `Can I have ${i} ice, ${l} lemon, ${s} sugar and ${w} water?`,
  (i, l, s, w) => `I'll take ${i} ice, ${l} lemon, ${s} sugar and ${w} water!`,
  (i, l, s, w) => `One lemonade please — ${i} ice, ${l} lemon, ${s} sugar and ${w} water.`,
  (i, l, s, w) => `Ooh, could I get ${i} ice, ${l} lemon, ${s} sugar and ${w} water?`,
  (i, l, s, w) => `I want ${i} ice, ${l} lemon, ${s} sugar and ${w} water please!`,
  (i, l, s, w) => `Excuse me! ${i} ice, ${l} lemon, ${s} sugar and ${w} water for me!`,
  (i, l, s, w) => `Can you make mine ${i} ice, ${l} lemon, ${s} sugar and ${w} water?`,
];

function generateOrder() {
  while (true) {
    const lcd   = LCDS[Math.floor(Math.random() * LCDS.length)];
    const parts = randomPartition(lcd, 4);
    const fracs = parts.map(p => simplify(p, lcd));

    // Skip if any simplified denominator is > 10 (not available on the picker)
    if (!fracs.every(f => f.d <= 10)) continue;

    const [ice, lemon, sugar, water] = fracs.map(f => `${f.n}/${f.d}`);
    const tmpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];

    return {
      // Spoken text uses words
      text: tmpl(toWords(ice), toWords(lemon), toWords(sugar), toWords(water)),
      // Answer values stay as "n/d" strings for comparison with dragged fractions
      ice, lemon, sugar, water
    };
  }
}

// 20 fresh orders every page load
const orders = Array.from({ length: 20 }, () => generateOrder());
