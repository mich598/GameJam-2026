/* ============================================================
   LEMONADE STAND CASHIER — Main.js
   Game logic: coins, change calculation, rounds, feedback
   ============================================================ */

'use strict';

// ── Change this ONE line to set how many customers complete a day ──
const CUSTOMERS_PER_DAY = 1;

// ── Lemonade price (cents). Customer pays a random amount above this ──
const LEMONADE_PRICE_CENTS = 500;  // $5.00

// Random payment: multiple of 5c, between price+5c and $20.00
function generatePayment() {
    const min   = LEMONADE_PRICE_CENTS + 5;
    const max   = 2000; // $20.00
    const steps = Math.floor(Math.random() * ((max - min) / 5 + 1));
    return min + steps * 5;
}

// =============================================
//  GAME DATA
// =============================================

/**
 * All coin denominations the player can use.
 * value  — face value in CENTS
 * label  — text shown on the coin
 * type   — 'gold' | 'silver'  (styling)
 * size   — 'large' | 'medium' | 'small-c'  (CSS class)
 */
const COIN_DEFS = {
    200: { label: '$2',  type: 'gold',   size: 'large'   },
    100: { label: '$1',  type: 'gold',   size: 'large'   },
     50: { label: '50¢', type: 'silver', size: 'medium'  },
     20: { label: '20¢', type: 'silver', size: 'medium'  },
     10: { label: '10¢', type: 'silver', size: 'small-c' },
      5: { label: '5¢',  type: 'silver', size: 'small-c' },
};

// =============================================
//  GAME STATE
// =============================================

let state = {
    score: 0,
    changeGivenCents: 0,
    coinsInBox: [],
    submitted: false,
    hintVisible: false,
    priceCents:         LEMONADE_PRICE_CENTS,
    paymentCents:       LEMONADE_PRICE_CENTS + 5,
    requiredChangeCents: 5,
};

// =============================================
//  UTILITY FUNCTIONS
// =============================================

/**
 * Convert an integer number of cents to a "$X.XX" display string.
 */
function centsToDisplay(cents) {
    const dollars = Math.floor(cents / 100);
    const centPart = cents % 100;
    return '$' + dollars + '.' + String(centPart).padStart(2, '0');
}

/**
 * Generate an optimal coin breakdown for a given amount (greedy algorithm).
 * Returns an object: { 200: n, 100: n, 50: n, 20: n, 10: n, 5: n }
 */
function optimalBreakdown(cents) {
    const denominations = [200, 100, 50, 20, 10, 5];
    const result = {};
    let remaining = cents;
    for (const d of denominations) {
        if (remaining >= d) {
            result[d] = Math.floor(remaining / d);
            remaining  = remaining % d;
        }
    }
    return result;
}

// =============================================
//  DOM HELPERS
// =============================================

function el(id) {
    return document.getElementById(id);
}

/**
 * Display a status message below the cashier UI.
 * type: '' | 'error' | 'success' | 'info'
 */
function setStatus(msg, type = '') {
    const statusEl = el('statusMessage');
    statusEl.textContent  = msg;
    statusEl.className    = 'status-message ' + type;
    // Re-trigger CSS animation on every call
    statusEl.style.animation = 'none';
    void statusEl.offsetHeight; // force reflow
    statusEl.style.animation   = '';
}

/**
 * Shake the cashier UI panel to signal a wrong answer.
 */
function shakePanel() {
    const ui = document.querySelector('.cashier-ui');
    ui.classList.add('shake');
    ui.addEventListener('animationend', () => ui.classList.remove('shake'), { once: true });
}

// =============================================
//  COIN INTERACTION
// =============================================

/**
 * Called when the player clicks a coin in the "COINS TO GIVE" panel.
 * Adds the coin to the change box and updates the running total.
 */
function addCoin(valueCents) {
    if (state.submitted) return;

    // Hide the placeholder hint
    const hint = el('emptyHint');
    if (hint) hint.remove();

    // Update state
    state.coinsInBox.push(valueCents);
    state.changeGivenCents += valueCents;

    // Render the coin visually in the box
    spawnCoinInBox(valueCents);

    // Refresh the total display and colour-coding
    updateChangeDisplay();
}

/**
 * Create and append a coin DOM element inside the change box.
 */
function spawnCoinInBox(valueCents) {
    const def  = COIN_DEFS[valueCents];
    const box  = el('changeBox');
    const coin = document.createElement('div');

    coin.className   = `box-coin ${def.type} ${def.size}`;
    coin.textContent = def.label;
    coin.title       = 'Click to remove this coin';
    coin.dataset.value = String(valueCents);

    // Subtle random tilt for a natural "tossed in" feel
    const tilt = (Math.random() * 18 - 9).toFixed(1);
    coin.style.transform = `rotate(${tilt}deg)`;

    // Clicking a coin in the box removes it
    coin.addEventListener('click', () => removeCoinElement(coin, valueCents));

    box.appendChild(coin);
}

/**
 * Animate-out and remove a specific coin element from the box.
 */
function removeCoinElement(coinEl, valueCents) {
    if (state.submitted) return;

    // Animate removal
    coinEl.style.animation = 'coinRemove 0.22s ease-in forwards';
    setTimeout(() => {
        coinEl.remove();

        // Update state — remove the LAST matching value (LIFO)
        const idx = state.coinsInBox.lastIndexOf(valueCents);
        if (idx !== -1) state.coinsInBox.splice(idx, 1);
        state.changeGivenCents -= valueCents;

        // Show hint text again if box is now empty
        if (state.coinsInBox.length === 0) {
            el('changeBox').innerHTML =
                '';
        }

        updateChangeDisplay();
    }, 210);
}

// =============================================
//  HEADER BUTTONS: Undo / Clear All
// =============================================

/**
 * Remove the last coin that was placed (◄ Undo button).
 */
function clearLastCoin() {
    if (state.submitted || state.coinsInBox.length === 0) return;

    const box   = el('changeBox');
    const coins = box.querySelectorAll('.box-coin');
    if (coins.length > 0) {
        const lastCoin  = coins[coins.length - 1];
        const val       = parseInt(lastCoin.dataset.value, 10);
        removeCoinElement(lastCoin, val);
    }
}

/**
 * Remove all coins from the box (Clear ► button).
 */
function clearAllCoins() {
    if (state.submitted) return;

    state.changeGivenCents = 0;
    state.coinsInBox       = [];

    el('changeBox').innerHTML =
        '';

    updateChangeDisplay();
    setStatus('', '');
}

// =============================================
//  CHANGE DISPLAY & COLOUR CODING
// =============================================

/**
 * Refresh the "CHANGE GIVEN TOTAL" display with correct colour:
 *   Green  → exact match  ✅
 *   Red    → too much     ❌
 *   Default → still under
 */
function updateChangeDisplay() {
    const required = state.requiredChangeCents;
    const given    = state.changeGivenCents;
    const amountEl = el('changeGivenDisplay');

    amountEl.textContent = centsToDisplay(given);
    amountEl.classList.remove('over', 'exact', 'under');

    if (given === 0) {
        // Nothing in the box yet — neutral
        setStatus('', '');

    } else if (given === required) {
        // EXACT — green, positive feedback
        amountEl.classList.add('exact');
        setStatus('✅ Looks exactly right! Press SUBMIT to confirm.', 'success');

    } else if (given > required) {
        // OVER — red, warning
        const excess = given - required;
        amountEl.classList.add('over');
        setStatus(`⚠️ Too much by ${centsToDisplay(excess)}. Remove some coins.`, 'error');

    } else {
        // UNDER — still need more
        const still = required - given;
        setStatus(`Still need ${centsToDisplay(still)} more…`, 'info');
    }
}

// =============================================
//  SUBMIT
// =============================================

/**
 * Validate the player's change attempt.
 * Correct  → celebrate and advance.
 * Wrong    → shake, inform, let them try again.
 */
function submitChange() {
    if (state.submitted) return;

    const required = state.requiredChangeCents;
    const given    = state.changeGivenCents;

    if (given === required) {
        // ——— CORRECT ———
        state.submitted = true;
        setStatus('✅ Correct! Customer is happy.', 'success');
        launchConfetti();
        addEarnings(PRICE_PER_SALE);

        const servedToday = parseInt(localStorage.getItem('customersToday') || '0') + 1;

        if (servedToday >= CUSTOMERS_PER_DAY) {
          // Day is over — save which day just ended, then show the transition
          const day = parseInt(localStorage.getItem('dayNumber') || '1');
          localStorage.setItem('completedDay',    String(day));
          localStorage.setItem('dayNumber',       String(day + 1));
          localStorage.setItem('customersToday',  '0');
          setTimeout(() => { window.location.href = 'day_end.html'; }, 2000);
        } else {
          // More customers left today — loop straight back
          localStorage.setItem('customersToday', String(servedToday));
          setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        }
    } else if (given === 0) {
        setStatus('💡 You need to add some coins first!', 'error');
        shakePanel();
    } else if (given > required) {
        const excess = given - required;
        setStatus(`😬 That's ${centsToDisplay(excess)} too much. Remove a few coins.`, 'error');
        shakePanel();
    } else {
        const still = required - given;
        setStatus(`🤔 Not enough — you still need ${centsToDisplay(still)} more.`, 'error');
        shakePanel();
    }
}

// =============================================
//  HINT SYSTEM
// =============================================

/**
 * Toggle the hint panel showing an optimal coin breakdown.
 */
function toggleHint() {
    state.hintVisible = !state.hintVisible;
    const hintBox = el('hintBox');
    const hintBtn = el('hintBtn');

    if (state.hintVisible) {
        const required   = state.requiredChangeCents;
        const breakdown  = optimalBreakdown(required);
        const lines      = Object.entries(breakdown)
            .map(([denom, count]) => `${COIN_DEFS[denom].label} × ${count}`)
            .join('  +  ');

        hintBox.innerHTML  = `One way to make ${centsToDisplay(required)}:<br><strong>${lines}</strong>`;
        hintBox.style.display = 'block';
        hintBtn.textContent   = '🙈 Hide Hint';
    } else {
        hintBox.style.display = 'none';
        hintBtn.textContent   = '💡 Show Hint';
    }
}

// =============================================
//  OVERLAYS
// =============================================

function showSuccessOverlay() {
    // Success overlay removed — function kept for compatibility
}

/**
 * Advance to the next round or show the game-over screen.
 */
function nextRound() {
    // Next round functionality removed
}

function showGameOver() {
    // Game over screen removed
}

function restartGame() {
    // Restart game functionality removed
}

// =============================================
//  CONFETTI CELEBRATION
// =============================================

/**
 * Launch colourful confetti pieces on a correct answer.
 */
function launchConfetti() {
    const colours = [
        '#F5C518', '#FF6B6B', '#4ECDC4',
        '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    ];
    const count = 50;

    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';

        const colour   = colours[Math.floor(Math.random() * colours.length)];
        const startX   = Math.random() * window.innerWidth;
        const duration = 0.9 + Math.random() * 1.4;  // seconds
        const delay    = Math.random() * 0.6;          // seconds

        piece.style.cssText = `
            left: ${startX}px;
            top: -20px;
            background: ${colour};
            width: ${6 + Math.random() * 8}px;
            height: ${8 + Math.random() * 10}px;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        `;

        document.body.appendChild(piece);

        // Remove from DOM once animation finishes
        setTimeout(() => piece.remove(), (duration + delay) * 1000 + 200);
    }
}


// =============================================
//  KEYBOARD SHORTCUTS  (quality-of-life)
// =============================================

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'Enter':
            // Enter → submit
            submitChange();
            break;
        case 'Backspace':
        case 'Delete':
            // Backspace / Delete → undo last coin
            clearLastCoin();
            break;
        case 'Escape':
            // Escape → clear all
            clearAllCoins();
            break;
    }
});

// =============================================
//  CANVAS SCALING — same approach as scene 1
// =============================================

function scaleGame() {
    const scale = Math.min(window.innerWidth / 1366, window.innerHeight / 630);
    const s   = document.getElementById('scene3');
    const sat = document.getElementById('sat-panel');
    if (s)   s.style.transform = `scale(${scale})`;
    const earn  = document.getElementById('earnings-panel');
    const pause = document.getElementById('pause-btn');
    if (sat)   { sat.style.transform   = `scale(${scale})`;  sat.style.transformOrigin   = 'top right';  }
    if (earn)  { earn.style.transform  = `scale(${scale})`; earn.style.transformOrigin  = 'top left';   }
    if (pause) { pause.style.transform = `scale(${scale})`; pause.style.transformOrigin = 'top center'; }
}
window.addEventListener('resize', scaleGame);

// =============================================
//  INITIALISE ON PAGE LOAD
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    scaleGame();
    applyLayout3();

    // Set customer image from saved gender
    const gender = localStorage.getItem('gender') || 'boy';
    const img = document.getElementById('customer-pay');
    if (img) img.src = `assets/customer_pay_${gender}.png`;

    initGame();
});

function applyLayout3() {
    function set(id, props) {
        const el = document.getElementById(id);
        if (el) Object.assign(el.style, props);
    }
    set('customer-pay',   LAYOUT_3.customerPay);
    set('speech-bubble',  LAYOUT_3.speechBubble);
    set('lemonade-img',   LAYOUT_3.lemonade);
    set('cashier-panel',  LAYOUT_3.cashierPanel);
    set('changeBox',      LAYOUT_3.changeBox);

    // Position each coin button over its register slot
    document.querySelectorAll('.coin-btn').forEach(btn => {
        const cfg = LAYOUT_3.coins[btn.dataset.val];
        if (cfg) Object.assign(btn.style, cfg);
    });
}

function initGame() {
    state.changeGivenCents  = 0;
    state.coinsInBox        = [];
    state.submitted         = false;
    state.hintVisible       = false;

    // Generate a fresh random payment for this customer
    state.priceCents          = LEMONADE_PRICE_CENTS;
    state.paymentCents        = generatePayment();
    state.requiredChangeCents = state.paymentCents - state.priceCents;

    el('customerPayment').textContent  = centsToDisplay(state.paymentCents);
    el('paid-display').textContent     = centsToDisplay(state.paymentCents);
    el('requiredChange').textContent   = centsToDisplay(state.requiredChangeCents);
    el('changeGivenDisplay').textContent = '$0.00';

    const box = el('changeBox');
    box.innerHTML = '';

    el('hintBox').style.display = 'none';
    el('hintBtn').textContent = '💡 Show Hint';

    setStatus('', '');
}