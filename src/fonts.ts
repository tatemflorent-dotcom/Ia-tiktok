import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FONT } from "./theme";

export const fontsLoaded = Promise.all(
  ["600", "800", "900"].map((weight) =>
    loadFont({
      family: FONT,
      url: staticFile(`fonts/montserrat-latin-${weight}-normal.woff2`),
      weight,
    }),
  ),
);
