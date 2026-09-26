import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT, safe } from "../theme";
import { clamp } from "../lib/time";
import { normalizeWord, textStroke } from "../lib/text";

/**
 * Accroche des 3 premières secondes : gros texte, mots qui tombent un par un,
 * mots forts en jaune, petit "punch" de zoom puis sortie rapide.
 */
export const Hook: React.FC<{ text: string; highlight: string[] }> = ({ text, highlight }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // La ponctuation isolée (« ? », « ! », « : ») reste collée au mot précédent.
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .reduce<string[]>((acc, w) => {
      if (/^[?!:;»]+$/.test(w) && acc.length) acc[acc.length - 1] += `\u00A0${w}`;
      else acc.push(w);
      return acc;
    }, []);
  const hl = new Set(highlight.flatMap((h) => h.split(/\s+/)).map(normalizeWord));

  const stagger = Math.max(2, Math.min(5, Math.floor((fps * 1.2) / words.length)));
  const fontSize = words.length > 9 ? 104 : words.length > 6 ? 120 : 138;

  const exit = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp);
  const punch = spring({ frame: frame - words.length * stagger, fps, config: { damping: 9, stiffness: 180 } });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${safe.top}px ${safe.side}px ${safe.bottom - 120}px`,
        opacity: exit,
        scale: String(interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 1.25], clamp)),
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.08,
          textAlign: "center",
          textTransform: "uppercase",
          color: colors.white,
          letterSpacing: -1,
          scale: String(1 + 0.06 * punch - 0.06 * Math.min(1, punch)),
          rotate: `${interpolate(frame, [0, durationInFrames], [-2, 1], clamp)}deg`,
        }}
      >
        {words.map((w, i) => {
          const s = spring({ frame: frame - i * stagger, fps, config: { damping: 12, stiffness: 220 } });
          const isHl = hl.has(normalizeWord(w));
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 14px",
                color: isHl ? colors.yellow : colors.white,
                opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
                translate: `0px ${interpolate(s, [0, 1], [-140, 0], { easing: Easing.out(Easing.cubic) })}px`,
                scale: String(interpolate(s, [0, 1], [1.8, 1])),
                textShadow: "0 12px 40px rgba(0,0,0,0.6)",
                ...textStroke(16),
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
