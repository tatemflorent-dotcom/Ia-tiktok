"""Réglages du pipeline de production."""
import os
import sys
from pathlib import Path

# Sur Windows, npx est un script .cmd
NPX = "npx.cmd" if sys.platform == "win32" else "npx"

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT / "public"
GENERATED_DIR = PUBLIC_DIR / "generated"
OUTPUT_DIR = ROOT / "output"
BANK_FILE = ROOT / "content" / "banque_sujets.json"
HISTORY_FILE = ROOT / "data" / "historique.json"

# Voix off
DEFAULT_VOICE = "fr-FR-HenriNeural"
MAX_RATE = 25  # accélération max (%)
MIN_RATE = -15  # ralentissement max (%)

# Contraintes éditoriales
WORDS_MIN, WORDS_MAX = 170, 200
DURATION_MIN_S, DURATION_MAX_S = 62.0, 75.0
DURATION_TARGET_S = 69.0
SCENE_MIN_S, SCENE_MAX_S = 5.0, 8.0
HOOK_MIN_MS = 3000
TAIL_MS = 1200  # respiration après le dernier mot

# Génération de script (API Claude)
CLAUDE_MODEL = "claude-opus-5"

SCENE_TYPES = ("text", "screenshot", "shortcut", "steps", "stat")


def load_env_file() -> None:
    """Charge le fichier .env à la racine (utile pour les tâches planifiées, qui n'ont pas tes variables)."""
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
