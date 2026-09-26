"""Scripts vidéo : modèle, validation, choix d'un sujet non traité, génération via Claude."""
from __future__ import annotations

import json
import os
import re
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from . import history
from .config import BANK_FILE, CLAUDE_MODEL, WORDS_MAX, WORDS_MIN


class Scene(BaseModel):
    type: Literal["text", "screenshot", "shortcut", "steps", "stat"]
    title: Optional[str] = None
    subtitle: Optional[str] = None
    emoji: Optional[str] = None
    app: Optional[str] = None
    url: Optional[str] = None
    image: Optional[str] = None
    prompt: Optional[str] = None
    lines: Optional[List[str]] = None
    keys: Optional[List[str]] = None
    label: Optional[str] = None
    items: Optional[List[str]] = None
    value: Optional[float] = None
    prefix: Optional[str] = None
    suffix: Optional[str] = None


class Segment(BaseModel):
    text: str = Field(description="Phrase(s) lue(s) par la voix off. *mot* = mot clé affiché en jaune.")
    scene: Scene


class Script(BaseModel):
    id: str = Field(description="slug unique en minuscules, ex: windows-historique-presse-papiers")
    sujet: str
    hook: str = Field(description="Accroche lue en premier, 6 à 10 mots, *mot* = mot fort")
    segments: List[Segment]
    legende: str
    hashtags: List[str]
    a_verifier: List[str] = Field(description="Chaque affirmation factuelle à vérifier avant publication")


# ---------------------------------------------------------------- validation

SPOKEN_WORD = re.compile(r"[\wÀ-ÿœŒ'’-]+")


def plain(text: str) -> str:
    return text.replace("*", "")


def spoken_text(s: Script) -> str:
    return " ".join([plain(s.hook)] + [plain(seg.text) for seg in s.segments])


def word_count(s: Script) -> int:
    return len(SPOKEN_WORD.findall(spoken_text(s)))


REQUIRED = {
    "text": ["title"],
    "screenshot": ["app"],
    "shortcut": ["keys", "label"],
    "steps": ["title", "items"],
    "stat": ["value", "label"],
}


def validate(s: Script) -> list[str]:
    errors = []
    n = word_count(s)
    if not WORDS_MIN <= n <= WORDS_MAX:
        errors.append(f"{n} mots (attendu {WORDS_MIN}-{WORDS_MAX})")
    low = " " + spoken_text(s).lower() + " "
    if re.search(r"\bvous\b|\bvotre\b|\bvos\b", low):
        errors.append("vouvoiement détecté (le script doit tutoyer)")
    if not re.search(r"\btu\b|\bton\b|\bta\b|\btes\b|\bt'", low):
        errors.append("pas de tutoiement détecté")
    hook_words = len(SPOKEN_WORD.findall(plain(s.hook)))
    if not 4 <= hook_words <= 12:
        errors.append(f"accroche de {hook_words} mots (attendu 4-12)")
    if not 7 <= len(s.segments) <= 12:
        errors.append(f"{len(s.segments)} segments (attendu 7-12, une scène toutes les 5-8 s)")
    for i, seg in enumerate(s.segments):
        missing = [k for k in REQUIRED[seg.scene.type] if getattr(seg.scene, k) in (None, [], "")]
        if missing:
            errors.append(f"segment {i + 1} ({seg.scene.type}) : champs manquants {missing}")
        words = len(SPOKEN_WORD.findall(plain(seg.text)))
        if not 10 <= words <= 28:
            errors.append(f"segment {i + 1} : {words} mots (attendu ~14-22 pour 5-8 s)")
    if not s.a_verifier:
        errors.append("liste « à vérifier » vide")
    return errors


# ---------------------------------------------------------------- sources

def load_bank() -> list[Script]:
    if not BANK_FILE.exists():
        return []
    return [Script.model_validate(x) for x in json.loads(BANK_FILE.read_text(encoding="utf-8"))]


def next_from_bank(exclude_ids: set[str]) -> Script | None:
    done = history.load()
    for s in load_bank():
        if s.id not in exclude_ids and not history.is_done(done, s.id, s.sujet):
            return s
    return None


SYSTEM_PROMPT = f"""Tu écris des scripts de vidéos TikTok francophones (chaîne sur les outils IA et les astuces tech).

Règles impératives :
- Français, TUTOIEMENT uniquement (jamais « vous »).
- Texte parlé total (accroche + segments) : entre {WORDS_MIN} et {WORDS_MAX} mots (vise ~185).
- FACTUEL UNIQUEMENT : n'affirme que ce dont tu es sûr et qui est stable dans le temps. Pas de prix,
  pas de chiffres incertains, pas de fonctionnalités annoncées mais non disponibles. En cas de doute, ne le dis pas.
- Accroche (champ hook) : 6 à 10 mots, très forte, crée la curiosité, lue dans les 3 premières secondes.
- 8 à 10 segments de 15 à 22 mots chacun (≈ 6 s de voix), chacun associé à UNE scène visuelle.
- Marque 1 à 3 mots clés par segment avec des astérisques : *mot*. Pas d'astérisques autour de la ponctuation.
- Écris les raccourcis comme ils se prononcent (« Windows plus V », « Contrôle Maj T »), les nombres en chiffres ou en lettres.
- Dernier segment : appel à l'abonnement + question pour les commentaires.
- Types de scènes :
  * text : title (≤ 30 caractères, *mot* possible), subtitle optionnel, emoji optionnel
  * screenshot : app (nom de l'outil), url (domaine officiel), prompt (texte tapé, optionnel), lines (2-3 lignes de résultat courtes)
  * shortcut : keys (ex: ["Ctrl", "Maj", "T"]), label
  * steps : title, items (2 à 4 étapes courtes)
  * stat : value (nombre), prefix/suffix optionnels, label — uniquement pour un chiffre certain
  Varie les types (au moins 3 types différents).
- a_verifier : liste exhaustive des affirmations factuelles à vérifier (versions, menus, disponibilité, chiffres).
- legende : 1 à 2 phrases accrocheuses pour la description TikTok, tutoiement, 1 emoji max.
- hashtags : 5 à 8 hashtags pertinents en minuscules, avec le #.
"""


def generate_with_claude(exclude_sujets: list[str], feedback: str | None = None) -> Script:
    import anthropic

    client = anthropic.Anthropic()
    user = "Propose un sujet NOUVEAU (outil IA ou astuce tech utile au quotidien) et écris le script.\n\n"
    if exclude_sujets:
        user += "Sujets DÉJÀ traités (interdits, même reformulés) :\n" + "\n".join(f"- {s}" for s in exclude_sujets)
    if feedback:
        user += f"\n\nTa proposition précédente était invalide : {feedback}\nCorrige ces points."

    response = client.messages.parse(
        model=CLAUDE_MODEL,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        output_config={"effort": "high"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user}],
        output_format=Script,
        # Si le modèle décline, l'API relance la requête sur un modèle de secours.
        extra_headers={"anthropic-beta": "server-side-fallback-2026-07-01"},
        extra_body={"fallbacks": "default"},
    )
    if response.stop_reason == "refusal" or response.parsed_output is None:
        raise RuntimeError(f"Génération refusée ou vide (stop_reason={response.stop_reason})")
    return response.parsed_output


def pick_script(source: str, exclude_ids: set[str]) -> Script:
    """source : 'banque', 'claude' ou 'auto' (Claude si une clé API est configurée, sinon banque)."""
    if source == "auto":
        source = "claude" if os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN") else "banque"

    if source == "banque":
        s = next_from_bank(exclude_ids)
        if s is None:
            raise SystemExit(
                "Plus aucun sujet non traité dans content/banque_sujets.json.\n"
                "Ajoute des scripts à la banque ou configure ANTHROPIC_API_KEY pour en générer."
            )
        errors = validate(s)
        if errors:
            raise SystemExit(f"Script de banque « {s.id} » invalide : " + " ; ".join(errors))
        return s

    done = [h["sujet"] for h in history.load()] + [s.sujet for s in load_bank() if s.id in exclude_ids]
    feedback = None
    for _ in range(3):
        s = generate_with_claude(done, feedback)
        errors = validate(s)
        if history.is_done(history.load(), s.id, s.sujet) or s.id in exclude_ids:
            errors.append("sujet déjà traité")
        if not errors:
            return s
        feedback = " ; ".join(errors)
        print(f"  ↻ script rejeté : {feedback}")
    raise SystemExit("Impossible d'obtenir un script valide après 3 essais.")
