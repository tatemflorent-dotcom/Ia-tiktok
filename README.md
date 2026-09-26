# IA TikTok — production de vidéos avec Remotion

Système de production de vidéos TikTok verticales (outils IA et astuces tech, en français).

## Avancement

| Étape | Contenu | État |
|---|---|---|
| 1 | Projet Remotion + skills Remotion | ✅ |
| 2 | Template vertical 1080×1920 / 30 fps | ✅ (en attente de validation) |
| 3 | Génération de script + historique des sujets | ⏳ |
| 4 | Voix off edge-tts synchronisée | ⏳ |
| 5 | Commande unique pour produire N vidéos | ⏳ |

## Installation

```bash
npm install
npm run studio        # ouvre Remotion Studio sur http://localhost:3000
```

Rendu de la vidéo de démo :

```bash
npx remotion render TikTokVideo out/demo.mp4
# ou avec des props personnalisées :
npx remotion render TikTokVideo out/video.mp4 --props=chemin/vers/props.json
```

> Si Chrome ne peut pas être téléchargé automatiquement, indique un Chromium
> existant : `REMOTION_BROWSER_EXECUTABLE=/chemin/vers/chrome npm run studio`.

## Le template (`TikTokVideo`)

- **Accroche** (0 → ~3 s) : très gros texte, mots qui tombent un par un, mots forts en jaune.
- **Sous-titres mot par mot** : 1 à 3 mots par page, gros, centrés, chaque mot apparaît
  quand il est prononcé, le mot en cours pulse, les **mots clés en jaune**.
- **Scènes** qui changent toutes les 5 à 8 s, avec fond animé et transition flash + zoom :
  - `text` : gros titre animé + emoji + sous-titre (`*mot*` = en jaune)
  - `screenshot` : capture d'outil (image dans `public/`) ou maquette animée de l'app
    (saisie qui se tape toute seule, cartes de résultat)
  - `shortcut` : raccourci clavier en touches 3D
  - `steps` : étapes numérotées
  - `stat` : gros chiffre avec compteur
- **Barre de progression** fine en bas.
- Durée calculée automatiquement à partir de `durationMs` (cible : 62 à 75 s).
- Zones sûres TikTok respectées (haut, bas et droite dégagés pour l'interface).

Toutes les données d'une vidéo passent par les props (schéma Zod dans
[`src/schema.ts`](src/schema.ts)) : accroche, mots avec timings, scènes, voix off.
La démo ([`src/sample/demo.ts`](src/sample/demo.ts)) utilise des timings estimés, sans voix.

## Structure

```
src/
  Root.tsx                 composition TikTokVideo (1080×1920, 30 fps)
  TikTokVideo.tsx          assemblage : accroche, scènes, sous-titres, barre, audio
  schema.ts                schéma des props
  theme.ts / fonts.ts      couleurs, zones sûres, police Montserrat (locale)
  components/
    Hook.tsx  Captions.tsx  ProgressBar.tsx  AnimatedBackground.tsx
    scenes/                une scène par type
  sample/demo.ts           vidéo d'exemple pour le Studio
public/fonts/              Montserrat (licence OFL)
.agents/skills/            skills Remotion officiels (liés dans .claude/skills/)
```
