import { z } from "zod";

/** Un mot prononcé par la voix off, avec son timing (ms depuis le début). */
export const wordSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  /** Mot clé mis en valeur (jaune) dans les sous-titres. */
  keyword: z.boolean().default(false),
});

const sceneBase = {
  startMs: z.number(),
  endMs: z.number(),
};

/** Gros texte animé sur fond animé. */
const textScene = z.object({
  ...sceneBase,
  type: z.literal("text"),
  title: z.string(),
  subtitle: z.string().optional(),
  emoji: z.string().optional(),
});

/** Capture d'écran d'un outil : image réelle (public/) ou maquette de fenêtre animée. */
const screenshotScene = z.object({
  ...sceneBase,
  type: z.literal("screenshot"),
  app: z.string(),
  url: z.string().optional(),
  /** Chemin relatif au dossier public/ (ex: "screenshots/chatgpt.png"). */
  image: z.string().optional(),
  /** Texte tapé dans le champ de saisie de la maquette. */
  prompt: z.string().optional(),
  /** Lignes/cartes qui apparaissent dans la maquette. */
  lines: z.array(z.string()).optional(),
});

/** Raccourci clavier en touches 3D. */
const shortcutScene = z.object({
  ...sceneBase,
  type: z.literal("shortcut"),
  keys: z.array(z.string()).min(1),
  label: z.string(),
});

/** Liste d'étapes numérotées. */
const stepsScene = z.object({
  ...sceneBase,
  type: z.literal("steps"),
  title: z.string(),
  items: z.array(z.string()).min(1).max(5),
});

/** Gros chiffre animé (compteur). */
const statScene = z.object({
  ...sceneBase,
  type: z.literal("stat"),
  value: z.number(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  label: z.string(),
});

export const sceneSchema = z.discriminatedUnion("type", [
  textScene,
  screenshotScene,
  shortcutScene,
  stepsScene,
  statScene,
]);

export const videoSchema = z.object({
  /** Durée totale en ms (fixe la durée de la composition). */
  durationMs: z.number().min(1000),
  /** Accroche affichée en très gros pendant les ~3 premières secondes. */
  hook: z.object({
    text: z.string(),
    /** Mots de l'accroche à surligner en jaune. */
    highlight: z.array(z.string()).default([]),
    /** Fin de l'accroche (ms). Les sous-titres commencent après. */
    endMs: z.number().default(3000),
  }),
  words: z.array(wordSchema),
  scenes: z.array(sceneSchema),
  /** Voix off, relative à public/ (ex: "generated/ma-video/voice.mp3"). */
  audioSrc: z.string().nullable().default(null),
  /** Musique de fond optionnelle, relative à public/. */
  musicSrc: z.string().nullable().default(null),
  musicVolume: z.number().min(0).max(1).default(0.08),
  /** Pseudo affiché discrètement en haut (vide = masqué). */
  handle: z.string().default(""),
});

export type Word = z.infer<typeof wordSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type VideoProps = z.infer<typeof videoSchema>;
