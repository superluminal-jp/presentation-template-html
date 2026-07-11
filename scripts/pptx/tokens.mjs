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
  accent: '0017C1', // --accent       -> key-900 -> blue-900
  accentWeak: 'E8F1FE', // --accent-weak  -> key-50  -> blue-50
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
