import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DIMENSIONS = 384;

/**
 * Deterministic hashing-based bag-of-character-trigrams embedding.
 *
 * This is NOT a real semantic model. It exists purely so the application can
 * boot and its semantic search code path can be exercised (e.g. before the
 * real ONNX model files are downloaded) without crashing. Quality is far
 * below the real all-MiniLM-L6-v2 model below.
 */
class FallbackEmbeddingService {
  dimensions() {
    return DIMENSIONS;
  }

  async embed(text) {
    const vector = new Float64Array(DIMENSIONS);
    if (!text || !text.trim()) {
      return Array.from(vector);
    }
    const normalized = text.toLowerCase();
    for (let i = 0; i < normalized.length - 2; i++) {
      const trigram = normalized.slice(i, i + 3);
      const bucket = hash(trigram) % DIMENSIONS;
      vector[bucket] += 1;
    }
    normalizeInPlace(vector);
    return Array.from(vector);
  }
}

function hash(text) {
  const digest = crypto.createHash('sha256').update(text, 'utf8').digest();
  return digest.readUInt32BE(0) % DIMENSIONS;
}

function normalizeInPlace(vector) {
  let sumSquares = 0;
  for (const v of vector) sumSquares += v * v;
  const norm = Math.sqrt(sumSquares);
  if (norm < 1e-9) return;
  for (let i = 0; i < vector.length; i++) vector[i] /= norm;
}

/**
 * Real local embedding model: all-MiniLM-L6-v2 run fully offline via
 * transformers.js (WASM ONNX Runtime under the hood - no native library
 * compilation required). Produces 384-dim mean-pooled, L2-normalized
 * sentence embeddings so cosine similarity works directly on the output.
 *
 * Expects the model laid out at:
 *   <modelsDir>/Xenova/all-MiniLM-L6-v2/{config.json,tokenizer.json,...}
 *   <modelsDir>/Xenova/all-MiniLM-L6-v2/onnx/model.onnx
 * (obtainable via `optimum-cli export onnx` - see scripts/download-model.sh)
 */
class OnnxEmbeddingService {
  constructor(extractor) {
    this.extractor = extractor;
  }

  dimensions() {
    return DIMENSIONS;
  }

  async embed(text) {
    const output = await this.extractor(text ?? '', { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }
}

/**
 * Picks the real ONNX embedding service if model files are present under
 * modelsDir, otherwise falls back to the deterministic hashing embedder so
 * the app can still boot and be exercised (e.g. in CI).
 */
export async function createEmbeddingService(modelsDir) {
  const modelRoot = path.join(modelsDir, 'Xenova', 'all-MiniLM-L6-v2');
  const modelFile = path.join(modelRoot, 'onnx', 'model.onnx');
  const configFile = path.join(modelRoot, 'config.json');

  if (fs.existsSync(modelFile) && fs.existsSync(configFile)) {
    try {
      console.log(`Using real ONNX embedding model at ${modelRoot}`);
      const { pipeline, env } = await import('@xenova/transformers');
      env.allowRemoteModels = false;
      env.localModelPath = modelsDir + path.sep;
      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: false,
      });
      return new OnnxEmbeddingService(extractor);
    } catch (err) {
      console.error('Failed to load ONNX embedding model, falling back to hashing embedding', err);
      return new FallbackEmbeddingService();
    }
  }

  console.warn(
    `No ONNX model found at ${modelRoot} (expected config.json + onnx/model.onnx). ` +
      'Using low-quality fallback embedding - see docs/ARCHITECTURE.md.'
  );
  return new FallbackEmbeddingService();
}
