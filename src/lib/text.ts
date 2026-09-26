/** Normalise un mot pour comparer (minuscules, sans ponctuation ni accents). */
export const normalizeWord = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%+]/g, "");

export const textStroke = (px: number) =>
  ({
    WebkitTextStroke: `${px}px #000`,
    paintOrder: "stroke fill",
  }) as const;
