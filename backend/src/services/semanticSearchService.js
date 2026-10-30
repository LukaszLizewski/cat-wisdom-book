import { cosineSimilarity } from '../embeddingCodec.js';

const MIN_SCORE = 0.05;
const MAX_RESULTS = 10;

export class SemanticSearchService {
  constructor(wisdomService, embeddingService) {
    this.wisdomService = wisdomService;
    this.embeddingService = embeddingService;
  }

  async search(query, userId) {
    const queryEmbedding = await this.embeddingService.embed(query);
    const candidates = this.wisdomService.findAllVisibleWithEmbeddings(userId);

    const scored = candidates
      .filter((w) => w.embedding)
      .map((w) => ({ wisdom: w, score: cosineSimilarity(queryEmbedding, w.embedding) }))
      .filter((r) => r.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);

    return scored;
  }
}
