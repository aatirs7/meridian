/**
 * Meridian's visual system, per the brand spec. Cold, celestial, exacting.
 * Obsidian is the home of the brand. Two restrained tones — warm bone (you) and
 * cool steel (him) — distinguish the two of us, both muted on purpose so neither
 * reads as the "winning" color. No gradients, no glow, no third color. Numbers
 * are the hero. Light mode mirrors every token name so the flip is one line.
 */

/** Every hex from the brand spec, as named constants. */
export const BRAND = {
  obsidian: "#0B0E12", // primary background, icon ground
  panel: "#12161C", // lifted surfaces, cards
  border: "#262E38", // hairline borders, dividers
  borderOnBlack: "#222A34", // borders on near-black
  starlight: "#E9EFF6", // apex node, primary text, the monochrome mark
  coolSteel: "#9DBFDC", // the arc, and "him" pillar
  warmBone: "#E7DECB", // "you" pillar
  accentRing: "#7FA8C9", // thin orbit ring / single accent
  captionGray: "#8B98A8", // muted secondary text
  lineMuted: "#3A4654", // faint reference lines
} as const;

export interface ThemeColors {
  background: string;
  /** A hair lighter than background — the ambient field behind panels. */
  backgroundElevated: string;
  surface: string;
  surfaceRaised: string;
  /** Most-elevated surface, for the hero panel and pressed insets. */
  surfaceHigh: string;
  border: string;
  /** Faintest divider, barely there. */
  hairline: string;
  text: string;
  textSecondary: string;
  textFaint: string;
  accent: string;
  /** The two side-by-side identity colors. Muted on purpose. */
  you: string;
  him: string;
  /** Translucent identity washes for fills, bars, and selected states. */
  youSoft: string;
  himSoft: string;
  youSofter: string;
  himSofter: string;
  /** Completion tint. Stays on-palette (no green third color). */
  done: string;
  danger: string;
  dangerSoft: string;
  /** Scrim behind modals / the apple button ground. */
  overlay: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
}

export const DARK_COLORS: ThemeColors = {
  background: BRAND.obsidian,
  backgroundElevated: "#0E1218",
  surface: BRAND.panel,
  surfaceRaised: "#171C24",
  surfaceHigh: "#1B212B",
  border: BRAND.border,
  hairline: "rgba(233,239,246,0.06)",
  text: BRAND.starlight,
  textSecondary: BRAND.captionGray,
  textFaint: "#5A6675",
  accent: BRAND.accentRing,
  you: BRAND.warmBone,
  him: BRAND.coolSteel,
  youSoft: "rgba(231,222,203,0.16)",
  himSoft: "rgba(157,191,220,0.16)",
  youSofter: "rgba(231,222,203,0.07)",
  himSofter: "rgba(157,191,220,0.07)",
  done: BRAND.accentRing,
  danger: "#C28A84", // dusty rose — caution without a vivid third color
  dangerSoft: "rgba(194,138,132,0.14)",
  overlay: "rgba(5,7,10,0.62)",
  tabBarBg: "rgba(11,14,18,0.92)",
  tabBarBorder: "rgba(233,239,246,0.06)",
  tabActive: BRAND.starlight,
  tabInactive: "#5A6675",
};

export const LIGHT_COLORS: ThemeColors = {
  background: "#F4F6F9",
  backgroundElevated: "#EEF1F5",
  surface: "#FFFFFF",
  surfaceRaised: "#ECEFF3",
  surfaceHigh: "#FFFFFF",
  border: "#D8DEE6",
  hairline: "rgba(18,22,28,0.08)",
  text: "#12161C",
  textSecondary: "#5A6675",
  textFaint: "#8B98A8",
  accent: "#4E7C9B",
  you: "#8A6E45", // warm bone, darkened for contrast on light
  him: "#3E6E96", // cool steel, darkened for contrast on light
  youSoft: "rgba(138,110,69,0.14)",
  himSoft: "rgba(62,110,150,0.14)",
  youSofter: "rgba(138,110,69,0.06)",
  himSofter: "rgba(62,110,150,0.06)",
  done: "#4E7C9B",
  danger: "#A35A54",
  dangerSoft: "rgba(163,90,84,0.12)",
  overlay: "rgba(18,22,28,0.38)",
  tabBarBg: "rgba(255,255,255,0.94)",
  tabBarBorder: "#D8DEE6",
  tabActive: "#12161C",
  tabInactive: "#8B98A8",
};

export function getColors(isDark: boolean): ThemeColors {
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}

/**
 * Typography. One precise grotesque (Space Grotesk) everywhere, two weights:
 * light/regular for body + wordmark, medium for emphasis. Never bold/heavy.
 * With a custom face, RN selects the weight by fontFamily (not fontWeight), so
 * we map our weight names to faces — and cap emphasis at medium per the brand.
 */
export const FONTS = {
  light: "SpaceGrotesk_300Light",
  regular: "SpaceGrotesk_400Regular",
  medium: "SpaceGrotesk_500Medium",
} as const;

/** Maps a semantic weight to a Space Grotesk face. semibold/bold cap at medium. */
export function fontFamilyFor(
  weight: "light" | "regular" | "medium" | "semibold" | "bold"
): string {
  if (weight === "light") return FONTS.light;
  if (weight === "regular") return FONTS.regular;
  return FONTS.medium; // medium | semibold | bold → medium (never heavier)
}

/** The wordmark treatment: wide tracking echoing the gap between the pillars. */
export const WORDMARK_TRACKING = 0.3; // em

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/** Type scale. The big quiet numbers are `mega` / `hero` / `display`. */
export const TYPE = {
  mega: 72,
  hero: 56,
  display: 40,
  title: 28,
  heading: 18,
  body: 16,
  label: 14,
  caption: 12,
  micro: 11,
} as const;

/** A soft, low elevation shadow used on the hero panel only. Quiet, not flashy. */
export const SHADOW = {
  shadowColor: "#000000",
  shadowOpacity: 0.35,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 8,
} as const;
