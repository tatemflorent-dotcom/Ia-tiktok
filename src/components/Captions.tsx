import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Word } from "../schema";
import { colors, FONT } from "../theme";
import { clamp, frameToMs } from "../lib/time";
import { textStroke } from "../lib/text";

const MAX_WORDS_PER_PAGE = 3;
const MAX_CHARS_PER_PAGE = 20;
/** Durée d'affichage max d'une page après son dernier mot (silence). */
const LINGER_MS = 500;

type Page = { words: Word[]; startMs: number; endMs: number };

/** Regroupe les mots en "pages" de 1 à 3 mots, coupées sur la ponctuation. */
export const buildPages = (words: Word[]): Page[] => {
  const pages: Page[] = [];
  let current: Word[] = [];
  const flush = () => {
    if (current.length === 0) return;
    pages.push({ words: current, startMs: current[0].startMs, endMs: current[current.length - 1].endMs });
    current = [];
  };
  for (const w of words) {
    const chars = current.reduce((n, x) => n + x.text.length + 1, 0) + w.text.length;
    if (current.length >= MAX_WORDS_PER_PAGE || (current.length > 0 && chars > MAX_CHARS_PER_PAGE)) flush();
    current.push(w);
    if (/[.,!?;:…]$/.test(w.text)) flush();
  }
  flush();
  // Chaque page reste affichée jusqu'à la suivante (sans dépasser un court silence).
  return pages.map((p, i) => ({
    ...p,
    endMs: Math.min(pages[i + 1]?.startMs ?? Infinity, p.endMs + LINGER_MS),
  }));
};

/**
 * Sous-titres dynamiques TikTok : gros, centrés, un mot apparaît à l'instant
 * où il est prononcé, le mot en cours "pulse", les mots clés sont en jaune.
 */
export const Captions: React.FC<{ words: Word[]; fromMs: number }> = ({ words, fromMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frameToMs(frame, fps);

  const pages = useMemo(() => buildPages(words.filter((w) => w.startMs >= fromMs - 50)), [words, fromMs]);
  const page = pages.find((p) => t >= p.startMs && t < p.endMs);
  if (!page) return null;

  const pageFrame = frame - Math.round((page.startMs / 1000) * fps);
  const pageIn = spring({ frame: pageFrame, fps, config: { damping: 14, stiffness: 260 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", top: 1120, bottom: "auto", height: 330, justifyContent: "center" }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 92,
          lineHeight: 1.1,
          textAlign: "center",
          textTransform: "uppercase",
          maxWidth: 940,
          scale: String(interpolate(pageIn, [0, 1], [0.85, 1])),
        }}
      >
        {page.words.map((w, i) => {
          const f = frame - Math.round((w.startMs / 1000) * fps);
          const appear = spring({ frame: f, fps, config: { damping: 11, stiffness: 300 } });
          const visible = t >= w.startMs - 30;
          const active = t >= w.startMs && t < w.endMs + 60;
          return (
            <span
              key={`${w.startMs}-${i}`}
              style={{
                display: "inline-block",
                margin: "0 20px",
                transformOrigin: "50% 60%",
                color: w.keyword ? colors.yellow : colors.white,
                opacity: visible ? interpolate(appear, [0, 0.25], [0, 1], clamp) : 0,
                scale: String(visible ? interpolate(appear, [0, 1], [0.5, 1]) * (active ? 1.08 : 1) : 0.5),
                translate: `0px ${visible ? interpolate(appear, [0, 1], [30, 0]) : 30}px`,
                textShadow: w.keyword
                  ? `0 0 30px ${colors.yellow}66, 0 8px 24px rgba(0,0,0,0.7)`
                  : "0 8px 24px rgba(0,0,0,0.7)",
                ...textStroke(14),
              }}
            >
              {w.text.replace(/[,;:]$/, "")}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
