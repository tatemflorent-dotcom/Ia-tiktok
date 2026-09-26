import type { Scene, VideoProps, Word } from "../schema";

/**
 * Vidéo de démonstration pour prévisualiser le template dans le Studio.
 * Les timings sont ESTIMÉS (pas de voix off) : en production, ils viennent
 * des WordBoundary d'edge-tts.
 *
 * Convention : *mot* = mot clé (jaune dans les sous-titres).
 */
type Segment = { text: string; scene: DistributiveOmit<Scene, "startMs" | "endMs"> | null };
type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;

const segments: Segment[] = [
  { text: "Tu copies-colles encore *une* *seule* chose à la fois ?", scene: null },
  {
    text: "Sur Windows 10 et 11, il existe un *historique* du *presse-papiers* intégré, et franchement, presque personne ne l'utilise.",
    scene: { type: "text", emoji: "📋", title: "L'*historique* du *presse-papiers*", subtitle: "Windows 10 et 11" },
  },
  {
    text: "Appuie en même temps sur *Windows* plus *V*. La toute première fois, Windows te propose de l'activer : clique simplement sur Activer.",
    scene: { type: "shortcut", keys: ["⊞ Win", "V"], label: "Puis clique sur « Activer »" },
  },
  {
    text: "À partir de là, Windows garde en mémoire les derniers éléments que tu copies, jusqu'à *vingt-cinq*, du texte, des liens et même des *images*.",
    scene: { type: "stat", value: 25, label: "éléments gardés en mémoire" },
  },
  {
    text: "Tu refais Windows plus V, tu choisis l'élément dans la liste, et il se colle *directement* là où se trouve ton curseur.",
    scene: {
      type: "screenshot",
      app: "Presse-papiers",
      url: "Windows + V",
      lines: ["📎 https://exemple.fr/article", "✉️ Merci pour ton retour, je regarde ça", "🖼️ Capture d'écran 14:32"],
    },
  },
  {
    text: "Astuce bonus : *épingle* les éléments que tu utilises souvent. Ils restent disponibles même après un *redémarrage*, contrairement aux autres.",
    scene: { type: "text", emoji: "📌", title: "*Épingle* tes favoris", subtitle: "Ils survivent au redémarrage" },
  },
  {
    text: "Et si tu veux tout vider d'un coup, va dans Paramètres, Système, Presse-papiers, puis clique sur *Effacer*.",
    scene: { type: "steps", title: "Tout effacer", items: ["Paramètres", "Système › Presse-papiers", "Effacer"] },
  },
  {
    text: "Dernier bonus : avec ton *compte* *Microsoft*, tu peux même *synchroniser* ton presse-papiers entre plusieurs PC, dans ces mêmes paramètres.",
    scene: { type: "text", emoji: "🔄", title: "*Synchronise* tes PC", subtitle: "Avec ton compte Microsoft" },
  },
  {
    text: "Abonne-toi pour une astuce tech chaque jour, et dis-moi en commentaire quel raccourci tu veux découvrir.",
    scene: { type: "text", emoji: "🚀", title: "Abonne-toi pour la *suite*" },
  },
];

/** Estimation grossière du débit d'une voix neuronale française. */
const estimateMs = (word: string) => {
  let ms = 80 + word.replace(/[^\p{L}\p{N}]/gu, "").length * 46;
  if (/[,;:]$/.test(word)) ms += 220;
  if (/[.!?]$/.test(word)) ms += 420;
  return ms;
};

const build = (): VideoProps => {
  const words: Word[] = [];
  const scenes: Scene[] = [];
  let t = 150;
  let hookEnd = 3000;

  segments.forEach((seg, i) => {
    const segStart = t;
    for (const raw of seg.text.split(/\s+/)) {
      const keyword = /^\*.*\*[.,!?;:]?$/.test(raw);
      const text = raw.replace(/\*/g, "");
      const d = estimateMs(text);
      const speak = Math.min(d, 80 + text.length * 46);
      words.push({ text, startMs: t, endMs: t + speak, keyword });
      t += d;
    }
    if (i === 0) hookEnd = Math.max(3000, t);
    if (seg.scene) {
      scenes.push({ ...seg.scene, startMs: i === 1 ? hookEnd : segStart, endMs: 0 } as Scene);
    }
    if (i === 0) t = hookEnd;
  });
  scenes.forEach((s, i) => (s.endMs = scenes[i + 1]?.startMs ?? t + 1500));

  return {
    durationMs: t + 1500,
    hook: { text: "Tu copies-colles encore UNE SEULE chose à la fois ?", highlight: ["une", "seule"], endMs: hookEnd },
    words,
    scenes,
    audioSrc: null,
    audioDelayMs: 0,
    musicSrc: null,
    musicVolume: 0.08,
    handle: "",
  };
};

export const demoProps: VideoProps = build();
