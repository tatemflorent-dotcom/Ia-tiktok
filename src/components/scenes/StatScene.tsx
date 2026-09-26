import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT } from "../../theme";
import { clamp } from "../../lib/time";
import { textStroke } from "../../lib/text";

/** Gros chiffre qui compte jusqu'à sa valeur, avec un libellé. */
export const StatScene: React.FC<{ value: number; prefix?: string; suffix?: string; label: string }> = ({
  value,
  prefix = "",
  suffix = "",
  label,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(frame, [4, 4 + fps * 1.2], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const decimals = Number.isInteger(value) ? 0 : 1;
  const shown = (value * progress).toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const done = spring({ frame: frame - 4 - fps * 1.2, fps, config: { damping: 7, stiffness: 200 } });
  const text = `${prefix}${shown}${suffix}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30, fontFamily: FONT }}>
      <div
        style={{
          fontWeight: 900,
          fontSize: text.length > 6 ? 200 : 280,
          lineHeight: 1,
          color: colors.yellow,
          textShadow: `0 0 80px ${colors.yellow}55`,
          scale: String(1 + 0.12 * done - 0.12 * Math.min(1, done)),
          ...textStroke(14),
        }}
      >
        {text}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 60,
          color: colors.white,
          textAlign: "center",
          textTransform: "uppercase",
          maxWidth: 880,
          opacity: interpolate(frame, [10, 22], [0, 1], clamp),
        }}
      >
        {label}
      </div>
    </div>
  );
};
