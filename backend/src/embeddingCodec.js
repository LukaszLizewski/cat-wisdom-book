/** Encodes/decodes Float32 embedding vectors to/from a compact BLOB for SQLite storage. */

export function encodeEmbedding(vector) {
  if (!vector) return null;
  return Buffer.from(Float32Array.from(vector).buffer);
}

export function decodeEmbedding(bytes) {
  if (!bytes) return null;
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return Array.from(new Float32Array(buffer));
}

/** Cosine similarity between two equal-length numeric vectors. */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA < 1e-12 || normB < 1e-12) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
