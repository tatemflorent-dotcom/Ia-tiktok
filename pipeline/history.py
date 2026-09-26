"""Historique des sujets déjà traités."""
import json
import re
import unicodedata
from datetime import date

from .config import HISTORY_FILE


def normalize(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def load() -> list[dict]:
    if not HISTORY_FILE.exists():
        return []
    return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))


def is_done(history: list[dict], script_id: str, sujet: str) -> bool:
    ids = {h["id"] for h in history}
    sujets = {normalize(h["sujet"]) for h in history}
    return script_id in ids or normalize(sujet) in sujets


def add(script_id: str, sujet: str, folder: str) -> None:
    history = load()
    history.append({"id": script_id, "sujet": sujet, "date": date.today().isoformat(), "dossier": folder})
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    HISTORY_FILE.write_text(json.dumps(history, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
