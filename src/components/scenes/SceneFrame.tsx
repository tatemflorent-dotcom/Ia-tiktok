import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedBackground } from "../AnimatedBackground";
import { safe } from "../../theme";
import { clamp } from "../../lib/time";

/**
 * Cadre commun à toutes les scènes : fond animé, entrée "zoom + flash"
 * au changement de scène, zone de contenu au-dessus des sous-titres.
 */
export const SceneFrame: React.FC<{ variant: number; children: React.ReactNode }> = ({ variant, children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 170 } });
  const exit = interpolate(frame, [durationInFrames - 5, durationInFrames], [1, 0], clamp);

  return (
    <AbsoluteFill>
      <AnimatedBackground variant={variant} />
      <AbsoluteFill
        style={{
          top: safe.top,
          height: 1100 - safe.top,
          padding: `0 ${safe.side}px`,
          justifyContent: "center",
          alignItems: "center",
          opacity: Math.min(interpolate(enter, [0, 0.4], [0, 1], clamp), exit),
          scale: String(interpolate(enter, [0, 1], [0.86, 1]) * interpolate(exit, [0, 1], [1.08, 1])),
          translate: `0px ${interpolate(enter, [0, 1], [80, 0])}px`,
        }}
      >
        {children}
      </AbsoluteFill>
      {/* Flash de transition */}
      <AbsoluteFill
        style={{
          backgroundColor: "white",
          opacity: interpolate(frame, [0, 4], [0.35, 0], clamp),
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

/** Utilitaire : apparition décalée d'un élément i (spring 0 → 1). */
export const useStagger = (i: number, delay = 6, start = 4) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - start - i * delay, fps, config: { damping: 14, stiffness: 200 } });
};
