"""Voix off edge-tts + timings mot par mot alignés sur le script."""
from __future__ import annotations

import asyncio
import difflib
import os
import re
import subprocess
from pathlib import Path

from .config import ROOT
from .history import normalize


def _patch_ca_bundle() -> None:
    """edge-tts utilise le magasin certifi : on respecte SSL_CERT_FILE s'il est défini (proxy d'entreprise)."""
    ca = os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE")
    if ca and Path(ca).exists():
        import certifi

        certifi.where = lambda: ca  # type: ignore[assignment]


async def _synthesize(text: str, voice: str, rate: str, out_mp3: Path) -> list[dict]:
    _patch_ca_bundle()
    import edge_tts  # importé après le patch CA

    communicate = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    boundaries = []
    with open(out_mp3, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 10_000  # 100 ns -> ms
                boundaries.append({"text": chunk["text"], "startMs": start, "endMs": start + chunk["duration"] / 10_000})
    if not boundaries:
        raise RuntimeError("edge-tts n'a renvoyé aucun timing de mot")
    return boundaries


def synthesize(text: str, voice: str, rate_pct: int, out_mp3: Path) -> list[dict]:
    rate = f"{'+' if rate_pct >= 0 else ''}{rate_pct}%"
    return asyncio.run(_synthesize(text, voice, rate, out_mp3))


def audio_duration_ms(path: Path) -> float:
    """Durée réelle du MP3 via le ffprobe embarqué dans Remotion."""
    out = subprocess.run(
        ["npx", "remotion", "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout.strip().splitlines()
    return float(out[-1]) * 1000


# ---------------------------------------------------------------- alignement

def tokenize(marked_text: str) -> list[dict]:
    """Mots affichés du script, avec leur statut de mot clé (*mot*)."""
    words = []
    for raw in marked_text.split():
        if re.fullmatch(r"[?!:;»«–—-]+", raw) and words:
            words[-1]["text"] += " " + raw  # ponctuation isolée : collée au mot précédent
            continue
        text = raw.replace("*", "")
        if text:
            words.append({"text": text, "keyword": raw.count("*") >= 2})
    return words


def align(words: list[dict], boundaries: list[dict]) -> list[dict]:
    """Associe à chaque mot du script le timing des mots prononcés (alignement caractère par caractère).

    Robuste aux différences de découpage (apostrophes, traits d'union, nombres lus en toutes lettres) :
    les mots non retrouvés sont interpolés entre leurs voisins.
    """
    s_chars, s_owner = [], []
    for i, w in enumerate(words):
        for c in normalize(w["text"]).replace(" ", ""):
            s_chars.append(c)
            s_owner.append(i)
    b_chars, b_owner = [], []
    for j, b in enumerate(boundaries):
        for c in normalize(b["text"]).replace(" ", ""):
            b_chars.append(c)
            b_owner.append(j)

    matched: dict[int, set[int]] = {}
    sm = difflib.SequenceMatcher(None, "".join(s_chars), "".join(b_chars), autojunk=False)
    for block in sm.get_matching_blocks():
        for k in range(block.size):
            matched.setdefault(s_owner[block.a + k], set()).add(b_owner[block.b + k])

    out: list[dict] = []
    for i, w in enumerate(words):
        js = matched.get(i)
        if js:
            out.append({**w, "startMs": min(boundaries[j]["startMs"] for j in js), "endMs": max(boundaries[j]["endMs"] for j in js)})
        else:
            out.append({**w, "startMs": None, "endMs": None})

    # Interpolation des trous
    i = 0
    while i < len(out):
        if out[i]["startMs"] is not None:
            i += 1
            continue
        k = i
        while k < len(out) and out[k]["startMs"] is None:
            k += 1
        left = out[i - 1]["endMs"] if i > 0 else 0.0
        right = out[k]["startMs"] if k < len(out) else left + 400 * (k - i)
        step = max(1.0, (right - left) / (k - i))
        for n in range(i, k):
            out[n]["startMs"] = left + step * (n - i)
            out[n]["endMs"] = left + step * (n - i + 1)
        i = k

    # Monotonie stricte
    for n in range(1, len(out)):
        if out[n]["startMs"] < out[n - 1]["startMs"]:
            out[n]["startMs"] = out[n - 1]["startMs"]
        out[n]["endMs"] = max(out[n]["endMs"], out[n]["startMs"] + 60)
    return [{**w, "startMs": round(w["startMs"]), "endMs": round(w["endMs"])} for w in out]


def estimate(words: list[dict], start_ms: float = 150) -> list[dict]:
    """Timings estimés (sans voix) : pour prévisualiser quand edge-tts est indisponible."""
    t = start_ms
    out = []
    for w in words:
        letters = len(re.sub(r"[^\w]", "", w["text"]))
        speak = 80 + letters * 46
        pause = 420 if re.search(r"[.!?]$", w["text"]) else 220 if re.search(r"[,;:]$", w["text"]) else 0
        out.append({**w, "startMs": round(t), "endMs": round(t + speak)})
        t += speak + pause
    return out
