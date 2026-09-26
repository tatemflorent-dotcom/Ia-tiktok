import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, palettes } from "../theme";
import { clamp } from "../lib/time";

/**
 * Fond animé : dégradé sombre + halos colorés qui dérivent + grille qui défile.
 * Uniquement des dégradés CSS (pas de filtre blur) pour un rendu rapide.
 */
export const AnimatedBackground: React.FC<{ variant: number }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const [c1, c2, c3] = palettes[variant % palettes.length];
  const t = frame / 30;
  const seed = variant * 1.7;

  const blob = (color: string, x: number, y: number, size: number) =>
    `radial-gradient(circle ${size}px at ${x}px ${y}px, ${color}CC 0%, ${color}55 40%, transparent 72%)`;

  const x1 = 250 + Math.sin(t * 0.6 + seed) * 180;
  const y1 = 420 + Math.cos(t * 0.5 + seed) * 220;
  const x2 = 850 + Math.cos(t * 0.45 + seed) * 200;
  const y2 = 1150 + Math.sin(t * 0.55 + seed) * 260;
  const x3 = 540 + Math.sin(t * 0.35 + seed * 2) * 320;
  const y3 = 1650 + Math.cos(t * 0.4 + seed) * 160;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: [blob(c1, x1, y1, 620), blob(c2, x2, y2, 680), blob(c3, x3, y3, 560)].join(","),
          opacity: 0.55,
          // Léger zoom continu sur la durée de la scène
          scale: String(
            interpolate(frame, [0, Math.max(1, durationInFrames)], [1.08, 1.0], clamp),
          ),
        }}
      />
      {/* Grille tech qui défile doucement */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.05) 2px, transparent 2px)",
          backgroundSize: "90px 90px",
          backgroundPosition: `0px ${(frame * 1.2) % 90}px`,
          maskImage: "radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)",
        }}
      />
      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
