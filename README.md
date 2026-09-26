# IA TikTok — production de vidéos avec Remotion

Système de production de vidéos TikTok verticales (outils IA et astuces tech, en français).

## Avancement

| Étape | Contenu | État |
|---|---|---|
| 1 | Projet Remotion + skills Remotion | ✅ |
| 2 | Template vertical 1080×1920 / 30 fps | ✅ validé |
| 3 | Génération de script + historique des sujets | ✅ |
| 4 | Voix off edge-tts synchronisée | ✅ |
| 5 | Commande unique pour produire N vidéos | ✅ |

## Installation

```bash
npm install
npm run setup         # dépendances Python : edge-tts, anthropic, pydantic
npm run studio        # ouvre Remotion Studio sur http://localhost:3000
```

## Produire des vidéos (une seule commande)

```bash
npm run produce -- 3                 # 3 vidéos prêtes à publier
npm run produce -- 1 --voix fr-FR-DeniseNeural
npm run produce -- 2 --source claude # force la génération via l'API Claude
npm run produce -- 1 --sans-voix     # aperçu sans voix (timings estimés)
```

Chaque vidéo arrive dans `output/<date>_<sujet>/` :

| Fichier | Contenu |
|---|---|
| `video.mp4` | la vidéo finale 1080×1920, 30 fps, 62–75 s |
| `legende.txt` | la description TikTok (légende + hashtags) |
| `hashtags.txt` | les hashtags seuls |
| `a_verifier.md` | checklist des affirmations factuelles + contrôles techniques |
| `script.md` | le script lu, découpé par scène avec les timings |
| `voix.mp3` | la voix off seule |
| `props.json` | les données Remotion (pour re-rendre ou retoucher dans le Studio) |

### Scripts (étape 3)

- **Avec `ANTHROPIC_API_KEY`** : un sujet nouveau est généré par Claude à chaque vidéo
  (170–200 mots, tutoiement, factuel, 8–10 scènes). Le script est validé automatiquement
  (nombre de mots, tutoiement, longueur des segments, champs des scènes) et régénéré si besoin.
- **Sans clé** : les sujets viennent de la banque [`content/banque_sujets.json`](content/banque_sujets.json)
  (6 scripts prêts). Tu peux y ajouter les tiens au même format.
- **Historique** : [`data/historique.json`](data/historique.json) liste les sujets déjà produits ;
  un sujet traité n'est jamais repris (et Claude reçoit la liste pour l'éviter).

### Voix off (étape 4)

edge-tts (voix `fr-FR-HenriNeural` par défaut) renvoie le timing de chaque mot prononcé. Ces timings
sont alignés sur les mots du script (y compris les nombres lus en lettres) pour les sous-titres.
Le débit est ajusté automatiquement pour que la vidéo dure 62–75 s et que chaque scène tienne
en 8 s max. Si l'accroche est prononcée en moins de 3 s, la voix est légèrement décalée pour
qu'elle reste 3 s à l'écran.

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
pipeline/                  production : script.py, tts.py, produce.py, history.py
content/banque_sujets.json scripts prêts à produire
data/historique.json       sujets déjà traités
.agents/skills/            skills Remotion officiels (liés dans .claude/skills/)
```
