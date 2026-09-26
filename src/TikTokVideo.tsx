import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import type { VideoProps } from "./schema";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { Hook } from "./components/Hook";
import { Captions } from "./components/Captions";
import { ProgressBar } from "./components/ProgressBar";
import { SceneRenderer } from "./components/scenes/SceneRenderer";
import { colors, FONT, safe } from "./theme";
import { msToFrame } from "./lib/time";

export const TikTokVideo: React.FC<VideoProps> = ({ hook, words, scenes, audioSrc, musicSrc, musicVolume, handle }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const hookFrames = Math.max(1, msToFrame(hook.endMs, fps));

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Accroche (0 → ~3 s) */}
      <Sequence durationInFrames={hookFrames} name="Accroche">
        <AnimatedBackground variant={0} />
        <Hook text={hook.text} highlight={hook.highlight} />
      </Sequence>

      {/* Scènes (une toutes les 5 à 8 s) */}
      {scenes.map((scene, i) => {
        const from = msToFrame(scene.startMs, fps);
        const to = i === scenes.length - 1 ? durationInFrames : msToFrame(scene.endMs, fps);
        if (to <= from) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from} name={`Scène ${i + 1} · ${scene.type}`}>
            <SceneRenderer scene={scene} index={i} />
          </Sequence>
        );
      })}

      {/* Sous-titres mot par mot (après l'accroche) */}
      <Captions words={words} fromMs={hook.endMs} />

      {handle ? (
        <AbsoluteFill style={{ top: safe.top - 90, left: safe.side, height: 60, fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "rgba(255,255,255,0.55)" }}>
          {handle}
        </AbsoluteFill>
      ) : null}

      <ProgressBar />

      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}
      {musicSrc ? <Audio src={staticFile(musicSrc)} volume={musicVolume} loop /> : null}
    </AbsoluteFill>
  );
};
