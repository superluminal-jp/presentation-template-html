// Resolved design-token values for the PPTX export PoC.
//
// These mirror the semantic tokens in `styles/tokens.semantic.css`, resolved
// through `tokens/vendor/tokens.css` to concrete hex values. Kept as a small
// hand-maintained map for the PoC; a later iteration can resolve these
// directly from the CSS so the deck follows token changes automatically.
//
// Canvas: 1280x720 px === 13.333x7.5 in (96 px/in). px -> pt is x0.75.

export const COLOR = {
  slideBg: 'FFFFFF', // --slide-bg  -> neutral-white
  surface: 'F2F2F2', // --surface   -> solid-gray-50
  textPrimary: '333333', // --text-primary   -> solid-gray-800
  textSecondary: '666666', // --text-secondary -> solid-gray-600
  textOnAccent: 'FFFFFF', // --text-on-accent -> neutral-white
  border: 'CCCCCC', // --border        -> solid-gray-200
  borderStrong: '999999', // --border-strong -> solid-gray-400
  accent: '0031D8', // --accent       -> key-800 -> blue-800 (デジタル庁プライマリ青 / HP 基調)
  accentWeak: 'E8F1FE', // --accent-weak  -> key-50  -> blue-50
  accentStrong: '00118F', // --accent-strong -> key-1000 -> blue-1000
  // state colors (weak bg / strong text) for callouts & banners
  successWeak: 'E6F5EC', // green-50
  successText: '115A36', // green-900
  warningWeak: 'FFEEE2', // orange-50
  warningText: 'AC3E00', // orange-900
  errorWeak: 'FDEEEE', // red-50
  errorText: 'CE0000', // red-900
};

// Categorical palette for multi-series charts — the デジタル庁ダッシュボード実践
// ガイドブック 7 パレット, mirroring `--cat-1..7` in styles/tokens.semantic.css
// (see docs/dashboard-consistency.md). Blue-led, gray-tailed; each面 ≥3:1 on white.
// Author-supplied chart figures drop into the placeholder frame on slide 06; this
// map is the sanctioned series palette when those figures are authored natively.
export const CAT = [
  '0031D8', // cat-1 blue        -> key-800
  '0877D7', // cat-2 light-blue  -> light-blue-700
  '008299', // cat-3 cyan        -> cyan-800
  '1D8B56', // cat-4 green       -> green-700
  'E25100', // cat-5 orange      -> orange-700
  'FA0000', // cat-6 red         -> red-700
  '666666', // cat-7 solid-gray  -> solid-gray-600
];

// Theme color scheme (`ppt/theme/theme1.xml`). pptxgenjs hard-codes the Office
// scheme (accent1=#4472C4 …), so shapes/charts a user inserts *manually* in
// PowerPoint would default to Office blue, not DS blue. build-pptx patches the
// theme with this map so `accent1` = DS primary blue and accent2–6 = the DS
// categorical series; text2/bg2 use the DS gray ramp. Slots map Office → DS:
export const THEME = {
  dk2: '333333', // text2 -> solid-gray-800
  lt2: 'E6E6E6', // bg2   -> solid-gray-100
  accent1: CAT[0], // blue (DS primary — default fill for inserted shapes)
  accent2: CAT[1], // light-blue
  accent3: CAT[2], // cyan
  accent4: CAT[3], // green
  accent5: CAT[4], // orange
  accent6: CAT[5], // red
};

// Font families (theme fonts). Noto Sans JP is the design-system face; when it
// is unavailable the viewer substitutes automatically. Font embedding is out of
// scope for this PoC.
export const FONT = {
  sans: 'Noto Sans JP',
};

// Font sizes in points (source px x 0.75).
export const SIZE = {
  display: 48, // --fs-display 64px
  heading: 27, // --fs-h1 36px (slide heading)
  h2: 18, // --fs-h2 24px
  h3: 15, // --fs-h3 20px
  body: 13.5, // --fs-body 18px
  caption: 10.5, // --fs-caption 14px
};
