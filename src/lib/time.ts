export const msToFrame = (ms: number, fps: number) => Math.round((ms / 1000) * fps);
export const frameToMs = (frame: number, fps: number) => (frame / fps) * 1000;

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
