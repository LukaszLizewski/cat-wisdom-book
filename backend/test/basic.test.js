import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cosineSimilarity, encodeEmbedding, decodeEmbedding } from '../src/embeddingCodec.js';

test('cosineSimilarity of identical vectors is 1', () => {
  const v = [0.6, 0.8];
  assert.ok(Math.abs(cosineSimilarity(v, v) - 1) < 1e-9);
});

test('cosineSimilarity of orthogonal vectors is 0', () => {
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
});

test('embedding codec round-trips', () => {
  const original = [0.1, -0.2, 0.3, 0.0];
  const decoded = decodeEmbedding(encodeEmbedding(original));
  for (let i = 0; i < original.length; i++) {
    assert.ok(Math.abs(decoded[i] - original[i]) < 1e-6);
  }
});
