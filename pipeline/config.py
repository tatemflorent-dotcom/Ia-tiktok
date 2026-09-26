"""Réglages du pipeline de production."""
from pathlib import Path

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
