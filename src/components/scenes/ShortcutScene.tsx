import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors, FONT } from "../../theme";
import { clamp } from "../../lib/time";
import { useStagger } from "./SceneFrame";

/** Raccourci clavier : touches 3D qui tombent puis s'enfoncent ensemble. */
export const ShortcutScene: React.FC<{ keys: string[]; label: string }> = ({ keys, label }) => {
  const frame = useCurrentFrame();
  const pressAt = 8 + keys.length * 8 + 8;
  const press = interpolate(frame, [pressAt, pressAt + 3, pressAt + 9], [0, 1, 0], clamp);
  const labelIn = useStagger(keys.length + 1, 8, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 70 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap", justifyContent: "center" }}>
        {keys.map((k, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <Plus index={i} /> : null}
            <Key label={k} index={i} press={press} />
          </React.Fragment>
        ))}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 58,
          color: colors.white,
          textAlign: "center",
          maxWidth: 880,
          opacity: interpolate(labelIn, [0, 0.4], [0, 1], clamp),
          translate: `0px ${interpolate(labelIn, [0, 1], [30, 0])}px`,
        }}
      >
        {label}
      </div>
    </div>
  );
};

const Key: React.FC<{ label: string; index: number; press: number }> = ({ label, index, press }) => {
  const s = useStagger(index, 8, 8);
  const wide = label.length > 2;
  return (
    <div
      style={{
        minWidth: wide ? 260 : 190,
        height: 190,
        padding: "0 34px",
        borderRadius: 34,
        background: "linear-gradient(180deg, #FFFFFF 0%, #DCE1EE 100%)",
        boxShadow: `0 ${18 - press * 14}px 0 #8A93AB, 0 ${40 - press * 20}px 60px rgba(0,0,0,0.55)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: wide ? 64 : 96,
        color: "#111827",
        opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
        translate: `0px ${interpolate(s, [0, 1], [-260, 0]) + press * 14}px`,
        rotate: `${interpolate(s, [0, 1], [index % 2 ? 12 : -12, 0])}deg`,
      }}
    >
      {label}
    </div>
  );
};

const Plus: React.FC<{ index: number }> = ({ index }) => {
  const s = useStagger(index, 8, 6);
  return (
    <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 90, color: colors.yellow, scale: String(s) }}>+</div>
  );
};
