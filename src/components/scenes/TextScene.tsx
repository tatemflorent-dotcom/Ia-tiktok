import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT } from "../../theme";
import { clamp } from "../../lib/time";
import { textStroke } from "../../lib/text";

/** Grand titre animé mot par mot + emoji qui rebondit + sous-titre. */
export const TextScene: React.FC<{ title: string; subtitle?: string; emoji?: string }> = ({ title, subtitle, emoji }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = title.split(/\s+/).filter(Boolean);
  const fontSize = title.length > 40 ? 84 : title.length > 22 ? 100 : 124;
  const emojiIn = spring({ frame, fps, config: { damping: 8, stiffness: 140 } });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40, textAlign: "center" }}>
      {emoji ? (
        <div
          style={{
            fontSize: 190,
            lineHeight: 1,
            scale: String(emojiIn),
            translate: `0px ${Math.sin(frame / 9) * 12}px`,
            rotate: `${Math.sin(frame / 14) * 6}deg`,
            filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))",
          }}
        >
          {emoji}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize,
          lineHeight: 1.08,
          color: colors.white,
          textTransform: "uppercase",
          letterSpacing: -1,
        }}
      >
        {words.map((w, i) => {
          const s = spring({ frame: frame - 5 - i * 3, fps, config: { damping: 14, stiffness: 220 } });
          const isHl = w.startsWith("*") && w.endsWith("*");
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 12px",
                color: isHl ? colors.yellow : colors.white,
                opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
                translate: `0px ${interpolate(s, [0, 1], [60, 0])}px`,
                ...textStroke(10),
              }}
            >
              {w.replace(/\*/g, "")}
            </span>
          );
        })}
      </div>
      {subtitle ? (
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 46,
            color: colors.muted,
            maxWidth: 860,
            opacity: interpolate(frame, [14, 26], [0, 1], clamp),
            translate: `0px ${interpolate(frame, [14, 26], [20, 0], clamp)}px`,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};
