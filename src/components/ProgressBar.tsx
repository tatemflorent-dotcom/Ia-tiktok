import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";

/** Barre de progression fine et discrète en bas de l'écran. */
export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = Math.min(1, frame / Math.max(1, durationInFrames - 1));

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end" }}>
      <div style={{ height: 8, width: "100%", backgroundColor: "rgba(255,255,255,0.14)" }}>
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${colors.white}, ${colors.yellow})`,
            boxShadow: `0 0 12px ${colors.yellow}88`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
