import React from "react";
import { interpolate } from "remotion";
import { colors, FONT } from "../../theme";
import { clamp } from "../../lib/time";
import { useStagger } from "./SceneFrame";

/** Liste d'étapes numérotées qui apparaissent une à une. */
export const StepsScene: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
  const titleIn = useStagger(0, 0, 2);
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 34, fontFamily: FONT }}>
      <div
        style={{
          fontWeight: 900,
          fontSize: 76,
          color: colors.white,
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 10,
          opacity: interpolate(titleIn, [0, 0.4], [0, 1], clamp),
        }}
      >
        {title}
      </div>
      {items.map((item, i) => (
        <Step key={i} index={i} text={item} />
      ))}
    </div>
  );
};

const Step: React.FC<{ index: number; text: string }> = ({ index, text }) => {
  const s = useStagger(index, 12, 10);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 30,
        padding: "26px 32px",
        borderRadius: 30,
        backgroundColor: colors.card,
        border: `2px solid ${colors.cardBorder}`,
        opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
        translate: `${interpolate(s, [0, 1], [index % 2 ? 140 : -140, 0])}px 0px`,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 86,
          height: 86,
          borderRadius: 43,
          backgroundColor: colors.yellow,
          color: "#000",
          fontWeight: 900,
          fontSize: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {index + 1}
      </div>
      <div style={{ fontWeight: 800, fontSize: 48, color: colors.white, lineHeight: 1.15 }}>{text}</div>
    </div>
  );
};
