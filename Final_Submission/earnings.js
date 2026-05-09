// earnings.js — tracks accumulated lemonade earnings across all customers
// Goal: reach $13.00

const EARNINGS_GOAL  = 13.00;
const PRICE_PER_SALE =  5.00; // earned per successfully served customer

function getEarnings() {
  return parseFloat(localStorage.getItem('earnings') || '0');
}

function addEarnings(amount) {
  const newTotal = Math.min(getEarnings() + amount, EARNINGS_GOAL);
  localStorage.setItem('earnings', newTotal.toFixed(2));
  updateEarningsBar();
  if (newTotal >= EARNINGS_GOAL) onGoalReached();
  return newTotal;
}

function updateEarningsBar() {
  const earned = getEarnings();
  const pct    = Math.min(earned / EARNINGS_GOAL * 100, 100);
  const fill   = document.getElementById('earnings-fill');
  const label  = document.getElementById('earnings-label');
  if (fill)  fill.style.width  = pct + '%';
  if (label) label.textContent = `$${earned.toFixed(2)} / $${EARNINGS_GOAL.toFixed(2)}`;
}

function onGoalReached() {
  const panel = document.getElementById('earnings-panel');
  if (panel) {
    panel.style.background   = 'rgba(200,255,200,0.96)';
    panel.style.borderColor  = '#4caf50';
  }
  const label = document.getElementById('earnings-label');
  if (label) label.textContent = '🎉 $13.00 reached!';
}

document.addEventListener('DOMContentLoaded', updateEarningsBar);
