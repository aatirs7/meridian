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
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textSecondary: string;
  textFaint: string;
  accent: string;
  /** The two side-by-side identity colors. Muted on purpose. */
  you: string;
  him: string;
  /** Completion tint. Stays on-palette (no green third color). */
  done: string;
  danger: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
}

export const DARK_COLORS: ThemeColors = {
  background: BRAND.obsidian,
  surface: BRAND.panel,
  surfaceRaised: "#171C24",
  border: BRAND.border,
  text: BRAND.starlight,
  textSecondary: BRAND.captionGray,
  textFaint: "#5A6675",
  accent: BRAND.accentRing,
  you: BRAND.warmBone,
  him: BRAND.coolSteel,
  done: BRAND.accentRing,
  danger: "#C28A84", // dusty rose — caution without a vivid third color
  tabBarBg: BRAND.obsidian,
  tabBarBorder: "#161B22",
  tabActive: BRAND.starlight,
  tabInactive: "#5A6675",
};

export const LIGHT_COLORS: ThemeColors = {
  background: "#F4F6F9",
  surface: "#FFFFFF",
  surfaceRaised: "#ECEFF3",
  border: "#D8DEE6",
  text: "#12161C",
  textSecondary: "#5A6675",
  textFaint: "#8B98A8",
  accent: "#4E7C9B",
  you: "#8A6E45", // warm bone, darkened for contrast on light
  him: "#3E6E96", // cool steel, darkened for contrast on light
  done: "#4E7C9B",
  danger: "#A35A54",
  tabBarBg: "#FFFFFF",
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

/** Type scale. The big quiet numbers are `hero` / `display`. */
export const TYPE = {
  hero: 56,
  display: 40,
  title: 24,
  heading: 18,
  body: 16,
  label: 14,
  caption: 12,
} as const;
