"""Production en série : `npm run produce -- 3` produit 3 vidéos prêtes à publier.

Pour chaque vidéo : output/<date>_<sujet>/
    video.mp4        la vidéo finale 1080x1920
    voix.mp3         la voix off seule
    legende.txt      description TikTok (légende + hashtags)
    hashtags.txt     hashtags seuls
    a_verifier.md    affirmations à vérifier avant publication + contrôles techniques
    script.md        script lu, découpé par scène
    props.json       données passées à Remotion (re-rendu possible)
"""
from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

from . import history, tts
from .config import (
    DEFAULT_VOICE, DURATION_MAX_S, DURATION_MIN_S, DURATION_TARGET_S, GENERATED_DIR, HOOK_MIN_MS,
    MAX_RATE, MIN_RATE, OUTPUT_DIR, ROOT, SCENE_MAX_S, SCENE_MIN_S, TAIL_MS,
)
from .script import Script, pick_script, plain, word_count


def ensure_final_punct(text: str) -> str:
    text = text.strip()
    return text if re.search(r"[.!?…]$", text) else text + "."


def build_words(s: Script) -> tuple[list[dict], str]:
    """Mots affichés (avec index de segment : -1 = accroche) et texte envoyé à la synthèse vocale."""
    parts = [ensure_final_punct(s.hook)] + [ensure_final_punct(seg.text) for seg in s.segments]
    words = []
    for idx, part in enumerate(parts):
        for w in tts.tokenize(part):
            words.append({**w, "segment": idx - 1})
    return words, " ".join(plain(p) for p in parts)


def scene_lengths_s(timed: list[dict], n_segments: int, total_ms: float) -> list[float]:
    starts = {}
    for w in timed:
        starts.setdefault(w["segment"], w["startMs"])
    bounds = [max(HOOK_MIN_MS, starts.get(0, HOOK_MIN_MS))] + [starts[i] for i in range(1, n_segments)] + [total_ms]
    return [(b - a) / 1000 for a, b in zip(bounds, bounds[1:])]


def voice_track(s: Script, words: list[dict], text: str, workdir: Path, voice: str) -> tuple[list[dict], Path | None, float]:
    """Synthèse + ajustement du débit : durée totale 62-75 s et, si possible, scènes de 8 s max."""
    mp3 = workdir / "voice.mp3"
    rate = 0
    for attempt in range(4):
        boundaries = tts.synthesize(text, voice, rate, mp3)
        audio_ms = tts.audio_duration_ms(mp3)
        timed = tts.align(words, boundaries)
        total_ms = max(audio_ms, boundaries[-1]["endMs"]) + TAIL_MS
        total_s = total_ms / 1000
        longest = max(scene_lengths_s(timed, len(s.segments), total_ms))
        print(f"  🎙️  débit {rate:+d}% → {total_s:.1f} s, scène la plus longue {longest:.1f} s")

        # Facteur d'accélération souhaité (>1) ou de ralentissement (<1)
        factor = 1.0
        if total_s > DURATION_MAX_S - 0.5:
            factor = total_s / DURATION_TARGET_S
        elif longest > SCENE_MAX_S + 0.2:
            # accélérer pour raccourcir les scènes, sans passer sous la durée minimale
            factor = min(longest / SCENE_MAX_S, total_s / (DURATION_MIN_S + 0.5))
        elif total_s < DURATION_MIN_S - 2.5:
            factor = total_s / DURATION_TARGET_S
        new_rate = max(MIN_RATE, min(MAX_RATE, rate + round((factor - 1) * 100)))
        if abs(factor - 1) < 0.015 or new_rate == rate:
            break
        rate = new_rate
    return timed, mp3, audio_ms


def build_props(s: Script, timed: list[dict], audio_src: str | None, audio_ms: float) -> tuple[dict, list[str]]:
    warnings: list[str] = []
    seg_start = {}
    for w in timed:
        seg_start.setdefault(w["segment"], w["startMs"])

    # L'accroche occupe au moins les 3 premières secondes : si besoin on retarde la voix.
    first_seg = seg_start.get(0, HOOK_MIN_MS)
    delay = max(0, HOOK_MIN_MS - first_seg)
    if delay:
        for w in timed:
            w["startMs"] += delay
            w["endMs"] += delay
        seg_start = {k: v + delay for k, v in seg_start.items()}
    hook_end = seg_start.get(0, HOOK_MIN_MS)

    speech_end = timed[-1]["endMs"]
    duration = max(speech_end + TAIL_MS, audio_ms + delay + 300, DURATION_MIN_S * 1000)
    if duration > DURATION_MAX_S * 1000:
        warnings.append(f"Durée {duration / 1000:.1f} s > {DURATION_MAX_S:.0f} s : raccourcir le script.")

    scenes = []
    for i, seg in enumerate(s.segments):
        start = hook_end if i == 0 else seg_start[i]
        end = seg_start[i + 1] if i + 1 < len(s.segments) else duration
        scene = {k: v for k, v in seg.scene.model_dump().items() if v is not None}
        scenes.append({**scene, "startMs": round(start), "endMs": round(end)})
        length = (end - start) / 1000
        if not SCENE_MIN_S - 0.3 <= length <= SCENE_MAX_S + 0.3:
            warnings.append(f"Scène {i + 1} ({scene['type']}) dure {length:.1f} s (cible {SCENE_MIN_S:.0f}-{SCENE_MAX_S:.0f} s).")

    hook_highlight = [plain(m) for m in re.findall(r"\*([^*]+)\*", s.hook)]
    props = {
        "durationMs": round(duration),
        "hook": {"text": plain(s.hook), "highlight": hook_highlight, "endMs": round(hook_end)},
        "words": [{"text": w["text"], "startMs": w["startMs"], "endMs": w["endMs"], "keyword": w["keyword"]} for w in timed],
        "scenes": scenes,
        "audioSrc": audio_src,
        "audioDelayMs": round(delay),
        "musicSrc": None,
        "musicVolume": 0.08,
        "handle": "",
    }
    return props, warnings


def render(props_file: Path, out_mp4: Path) -> None:
    cmd = ["npx", "remotion", "render", "src/index.ts", "TikTokVideo", str(out_mp4), f"--props={props_file}", "--log=error"]
    subprocess.run(cmd, cwd=ROOT, check=True)


def write_texts(folder: Path, s: Script, props: dict, warnings: list[str], voiced: bool) -> None:
    hashtags = " ".join(h if h.startswith("#") else f"#{h}" for h in s.hashtags)
    (folder / "hashtags.txt").write_text(hashtags + "\n", encoding="utf-8")
    (folder / "legende.txt").write_text(f"{s.legende}\n\n{hashtags}\n", encoding="utf-8")

    lines = [f"# À vérifier avant publication — {s.sujet}", "", "## Affirmations factuelles", ""]
    lines += [f"- [ ] {item}" for item in s.a_verifier]
    lines += ["", "## Contrôles techniques", ""]
    lines.append(f"- Durée : {props['durationMs'] / 1000:.1f} s · {word_count(s)} mots · {len(props['scenes'])} scènes")
    if not voiced:
        lines.append("- ⚠️ Rendu SANS voix off (timings estimés) : ne pas publier en l'état.")
    lines += [f"- ⚠️ {w}" for w in warnings] or ["- ✅ Durées de scènes et durée totale dans les cibles."]
    lines += ["- [ ] Regarder la vidéo en entier (prononciation des noms d'outils, synchro des sous-titres)."]
    (folder / "a_verifier.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    md = [f"# {s.sujet}", "", f"**Accroche** : {plain(s.hook)}", ""]
    for i, (seg, sc) in enumerate(zip(s.segments, props["scenes"])):
        md.append(f"**Scène {i + 1}** · `{sc['type']}` · {sc['startMs'] / 1000:.1f}–{sc['endMs'] / 1000:.1f} s  ")
        md.append(plain(seg.text))
        md.append("")
    (folder / "script.md").write_text("\n".join(md), encoding="utf-8")


def produce_one(s: Script, args) -> Path:
    folder = OUTPUT_DIR / f"{date.today().isoformat()}_{s.id}"
    n = 2
    while folder.exists():
        folder = OUTPUT_DIR / f"{date.today().isoformat()}_{s.id}-{n}"
        n += 1
    folder.mkdir(parents=True)
    gen = GENERATED_DIR / folder.name
    gen.mkdir(parents=True, exist_ok=True)

    words, text = build_words(s)
    if args.sans_voix:
        timed, audio_src, audio_ms = tts.estimate(words), None, 0.0
    else:
        timed, mp3, audio_ms = voice_track(s, words, text, gen, args.voix)
        audio_src = f"generated/{folder.name}/voice.mp3"
        shutil.copy(mp3, folder / "voix.mp3")

    props, warnings = build_props(s, timed, audio_src, audio_ms)
    props_file = folder / "props.json"
    props_file.write_text(json.dumps(props, ensure_ascii=False, indent=2), encoding="utf-8")
    write_texts(folder, s, props, warnings, voiced=not args.sans_voix)
    for w in warnings:
        print(f"  ⚠️  {w}")

    if not args.pas_de_rendu:
        print(f"  🎬 rendu ({props['durationMs'] / 1000:.1f} s)…")
        render(props_file, folder / "video.mp4")
    if not args.sans_voix and not args.pas_de_rendu:
        history.add(s.id, s.sujet, folder.name)
    return folder


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(description="Produit N vidéos TikTok prêtes à publier.")
    p.add_argument("n", nargs="?", type=int, default=1, help="nombre de vidéos (défaut : 1)")
    p.add_argument("--source", choices=["auto", "banque", "claude"], default="auto",
                   help="origine des scripts (auto = API Claude si ANTHROPIC_API_KEY, sinon banque)")
    p.add_argument("--voix", default=DEFAULT_VOICE, help=f"voix edge-tts (défaut : {DEFAULT_VOICE})")
    p.add_argument("--sans-voix", action="store_true", help="aperçu sans voix off (timings estimés, non ajouté à l'historique)")
    p.add_argument("--pas-de-rendu", action="store_true", help="prépare les fichiers sans rendre le MP4")
    args = p.parse_args(argv)

    used: set[str] = set()
    done = []
    for i in range(args.n):
        s = pick_script(args.source, used)
        used.add(s.id)
        print(f"\n[{i + 1}/{args.n}] {s.sujet} ({word_count(s)} mots)")
        try:
            done.append(produce_one(s, args))
        except Exception as e:  # noqa: BLE001
            print(f"  ❌ échec : {e}", file=sys.stderr)
            if "403" in str(e) or "Cannot connect" in str(e):
                print("  → edge-tts injoignable (réseau). Réessaie plus tard ou utilise --sans-voix pour un aperçu.", file=sys.stderr)
            raise
    print("\n✅ Terminé :")
    for f in done:
        print(f"   {f.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
