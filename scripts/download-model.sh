#!/usr/bin/env bash
# Downloads and exports the all-MiniLM-L6-v2 sentence-transformer model to
# ONNX format, laid out the way @xenova/transformers (transformers.js)
# expects to load it fully offline: models/Xenova/all-MiniLM-L6-v2/{config.json,
# tokenizer.json, tokenizer_config.json, special_tokens_map.json, vocab.txt,
# onnx/model.onnx}.
#
# Requires Python 3.9+ with pip access. Creates a throwaway virtualenv so it
# doesn't pollute your system Python, then copies the exported files into
# ./models (the same directory docker-compose.yml mounts as /app/models).
#
# Usage:
#   ./scripts/download-model.sh [target-dir]
#
# If the model files are not present, the backend automatically falls back
# to a low-quality hashing-based embedder (see src/services/embeddingService.js)
# so the app still runs/demos without this step.
set -euo pipefail

MODEL_NAME="sentence-transformers/all-MiniLM-L6-v2"
MODELS_ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/models}"
TARGET_DIR="${MODELS_ROOT}/Xenova/all-MiniLM-L6-v2"
VENV_DIR="$(mktemp -d)"
EXPORT_TMP="$(mktemp -d)"

echo "Exporting ${MODEL_NAME} to ONNX..."
echo "Target directory: ${TARGET_DIR}"

python3 -m venv "${VENV_DIR}"
# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"

pip install --quiet --upgrade pip
pip install --quiet "optimum[exporters]" onnx onnxruntime

optimum-cli export onnx \
  --model "${MODEL_NAME}" \
  --task feature-extraction \
  "${EXPORT_TMP}"

mkdir -p "${TARGET_DIR}/onnx"
cp "${EXPORT_TMP}/config.json" "${TARGET_DIR}/"
cp "${EXPORT_TMP}/tokenizer.json" "${TARGET_DIR}/"
cp "${EXPORT_TMP}/tokenizer_config.json" "${TARGET_DIR}/"
cp "${EXPORT_TMP}/special_tokens_map.json" "${TARGET_DIR}/"
cp "${EXPORT_TMP}/vocab.txt" "${TARGET_DIR}/"
cp "${EXPORT_TMP}/model.onnx" "${TARGET_DIR}/onnx/model.onnx"

deactivate
rm -rf "${VENV_DIR}" "${EXPORT_TMP}"

echo "Done. Model files written under:"
echo "  ${TARGET_DIR}"
echo "Restart the backend (or docker compose) to pick up real semantic embeddings."
