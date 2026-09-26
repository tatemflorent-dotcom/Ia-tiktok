export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

export const FONT = "Montserrat";

export const colors = {
  bg: "#070A14",
  white: "#FFFFFF",
  yellow: "#FFE500",
  text: "#F4F6FF",
  muted: "rgba(244,246,255,0.65)",
  stroke: "#000000",
  card: "rgba(255,255,255,0.08)",
  cardBorder: "rgba(255,255,255,0.16)",
};

/** Palettes de fond qui tournent d'une scène à l'autre. */
export const palettes: [string, string, string][] = [
  ["#6D28D9", "#2563EB", "#DB2777"],
  ["#0EA5E9", "#10B981", "#6366F1"],
  ["#F43F5E", "#F59E0B", "#8B5CF6"],
  ["#22D3EE", "#A855F7", "#3B82F6"],
  ["#F97316", "#EC4899", "#6366F1"],
  ["#14B8A6", "#3B82F6", "#E11D48"],
];

/**
 * Zones sûres TikTok : l'interface (description, boutons) masque le bas
 * et la droite de l'écran. Le contenu important reste dans ces limites.
 */
export const safe = {
  top: 170,
  bottom: 420,
  side: 70,
  right: 150,
};
