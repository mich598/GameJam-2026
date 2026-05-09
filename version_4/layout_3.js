// =============================================================
//  SCENE 3 LAYOUT CONFIG
//  Adjust positions and sizes here — same idea as layout.js
//  Units: % = percentage of scene,  px = fixed pixels
// =============================================================

const LAYOUT_3 = {

  // ---- Paying customer ----
  customerPay: {
    bottom: '12%',
    left:   '13%',
    height: '70%',
    width:  'auto',
  },

  // ---- Speech bubble ----
  speechBubble: {
    bottom: '56%',
    left:   '31.5%',
    width:  '250px',
    height: '170px',
  },

  // ---- Lemonade glass on the counter ----
  lemonade: {
    bottom: '22%',
    left:   '27%',
    height: '170px',
    width:  'auto',
  },

  // ---- Cashier panel (info bar + register + controls) ----
  cashierPanel: {
    top:   '3%',
    right: '1%',
    width: '600px',
  },

  // ---- Change box (coin tray) — % of the register image ----
  //  Adjust these to move / resize the tray over the register picture
  changeBox: {
    left:   '14%',
    top:    '28.5%',
    width:  '46%',
    height: '45%',
  },

  // ---- Coin buttons — % / px of the register image ----
  //  left / top position the centre of each coin button over its slot
  //  width / height set the button size
  coins: {
    200: { left: '70%', top: '33%', width: '54px', height: '54px' },
    100: { left: '81%', top: '33%', width: '54px', height: '54px' },
     50: { left: '71.5%', top: '50%', width: '54px', height: '54px' },
     20: { left: '82.5%', top: '50%', width: '54px', height: '54px' },
     10: { left: '72.5%', top: '68%', width: '54px', height: '54px' },
      5: { left: '84.5%', top: '68%', width: '54px', height: '54px' },
  },

};
