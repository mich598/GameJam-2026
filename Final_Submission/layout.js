// =============================================================
//  LAYOUT CONFIG — tweak numbers here to reposition/resize
//  anything on screen without touching the game logic.
//
//  Units:
//    %   = percentage of the scene width or height
//    vh  = percentage of viewport height  (e.g. 40vh = 40%)
//    px  = fixed pixels
// =============================================================

const LAYOUT = {

  // ---- Customer character ----
  customer: {
    bottom: '12%',    // distance from bottom of screen
    left:   '10%',   // distance from left of screen
    height: '75%',   // how tall the character is
    width:  'auto',  // keep aspect ratio
  },

  // ---- Speech bubble ----
  bubble: {
    bottom:   '57%',   // sits just above the customer's head
    left:     '28%',
    width:    '400px',
    height:   '275px',
    fontSize: '13px',  // size of the text inside the bubble
    padding:  '20px 55px 45px 55px', // top / right / bottom / left — increase left+right to move text away from edges
  },

  // ---- Ticket (the whole ticket + drop zones) ----
  ticket: {
    top:   '8%',
    right: '15%',
    width: '330px',
  },

  // ---- Drop zones ON the ticket ----
  //  top       = distance from top of the ticket image
  //  left/right = distance from the ticket edges (use one or both)
  //  minHeight  = how tall each drop box is
  zones: {
    ice:   { top: '20%', left: '60px', right: '170px', minHeight: '28px' },
    lemon: { top: '36%', left: '60px', right: '170px', minHeight: '28px' },
    sugar: { top: '51.5%', left: '60px', right: '170px', minHeight: '28px' },
    water: { top: '67%', left: '60px', right: '170px', minHeight: '28px' },
  },

  // ---- Fraction drag buttons ----
  fractions: {
    bottom: '4%',
    left:   '50%',   // centred by CSS transform
  },

  // ---- Confirm Ticket button ----
  confirmBtn: {
    bottom: '4%',
    right:  '4%',
  },

  // ---- Feedback text ("Order written!" / "Try again!") ----
  feedback: {
    bottom: '14%',
    right:  '4%',
  },

};
