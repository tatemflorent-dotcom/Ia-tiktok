#!/usr/bin/env bash
# Production automatique (Mac / Linux). Lance N vidéos et garde un journal dans logs/.
# Usage : ./scripts/production.sh        (lit NB_VIDEOS et VOIX dans .env)
set -euo pipefail
cd "$(dirname "$0")/.."

# Les tâches planifiées (cron) n'ont pas le PATH habituel : on ajoute les emplacements courants.
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls "$HOME/.nvm/versions/node" 2>/dev/null | tail -1)/bin:$PATH"

[ -f .env ] && set -a && . ./.env && set +a
NB="${NB_VIDEOS:-1}"
VOIX="${VOIX:-fr-FR-HenriNeural}"

mkdir -p logs
LOG="logs/$(date +%Y-%m-%d_%H-%M).log"
echo "▶ Production de $NB vidéo(s) — journal : $LOG"
python3 -m pipeline.produce "$NB" --voix "$VOIX" 2>&1 | tee "$LOG"
