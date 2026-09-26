import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, FONT } from "../../theme";
import { clamp } from "../../lib/time";
import { useStagger } from "./SceneFrame";

type Props = { app: string; url?: string; image?: string; prompt?: string; lines?: string[] };

/**
 * Capture d'écran d'outil. Si `image` est fourni (fichier dans public/), on
 * l'affiche dans une fenêtre de navigateur avec un zoom lent. Sinon on dessine
 * une maquette animée : saisie qui se tape toute seule + cartes de résultat.
 */
export const ScreenshotScene: React.FC<Props> = ({ app, url, image, prompt, lines = [] }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const tilt = spring({ frame, fps, config: { damping: 20, stiffness: 90 } });

  return (
    <div
      style={{
        width: 900,
        height: 820,
        borderRadius: 36,
        overflow: "hidden",
        backgroundColor: "#0F1322",
        border: `2px solid ${colors.cardBorder}`,
        boxShadow: "0 50px 120px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        transform: `perspective(1800px) rotateX(${interpolate(tilt, [0, 1], [18, 4])}deg)`,
      }}
    >
      {/* Barre de fenêtre */}
      <div style={{ height: 78, display: "flex", alignItems: "center", gap: 14, padding: "0 28px", backgroundColor: "#1A1F33" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <div key={c} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c }} />
        ))}
        <div
          style={{
            marginLeft: 20,
            flex: 1,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(255,255,255,0.08)",
            color: colors.muted,
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 26,
            display: "flex",
            alignItems: "center",
            padding: "0 22px",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          🔒 {url ?? app}
        </div>
      </div>

      {image ? (
        <div style={{ flex: 1, overflow: "hidden" }}>
          <Img
            src={staticFile(image)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
              scale: String(interpolate(frame, [0, durationInFrames], [1.0, 1.12], clamp)),
            }}
          />
        </div>
      ) : (
        <MockBody app={app} prompt={prompt} lines={lines} />
      )}
    </div>
  );
};

const MockBody: React.FC<{ app: string; prompt?: string; lines: string[] }> = ({ app, prompt, lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typeStart = 10;
  const charsPerFrame = 1.4;
  const typed = prompt ? prompt.slice(0, Math.max(0, Math.floor((frame - typeStart) * charsPerFrame))) : "";
  const typingDone = !prompt || typed.length >= prompt.length;
  const linesStart = prompt ? typeStart + Math.ceil(prompt.length / charsPerFrame) + 6 : 8;
  const cursorOn = Math.floor(frame / 8) % 2 === 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 36, gap: 22, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 900,
            fontSize: 30,
          }}
        >
          {app.slice(0, 1).toUpperCase()}
        </div>
        <div style={{ color: colors.white, fontWeight: 800, fontSize: 40 }}>{app}</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18, justifyContent: "flex-start" }}>
        {lines.map((line, i) => (
          <MockLine key={i} text={line} index={i} start={linesStart} />
        ))}
      </div>

      {prompt ? (
        <div
          style={{
            minHeight: 96,
            borderRadius: 26,
            border: `2px solid ${typingDone ? colors.yellow : colors.cardBorder}`,
            backgroundColor: "rgba(255,255,255,0.06)",
            color: colors.white,
            fontWeight: 600,
            fontSize: 32,
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <span>
            {typed}
            <span style={{ opacity: cursorOn && !typingDone ? 1 : 0, color: colors.yellow }}>▍</span>
          </span>
          <span
            style={{
              flexShrink: 0,
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: typingDone ? colors.yellow : "rgba(255,255,255,0.15)",
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 900,
              scale: String(typingDone ? spring({ frame: frame - linesStart + 6, fps, config: { damping: 8 } }) * 0.2 + 0.8 : 1),
            }}
          >
            ↑
          </span>
        </div>
      ) : null}
    </div>
  );
};

const MockLine: React.FC<{ text: string; index: number; start: number }> = ({ text, index, start }) => {
  const s = useStagger(index, 10, start);
  return (
    <div
      style={{
        borderRadius: 22,
        backgroundColor: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        color: colors.text,
        fontWeight: 600,
        fontSize: 32,
        lineHeight: 1.3,
        padding: "22px 26px",
        opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
        translate: `${interpolate(s, [0, 1], [-60, 0])}px 0px`,
      }}
    >
      {text}
    </div>
  );
};
