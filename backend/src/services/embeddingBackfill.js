/**
 * Backfills embeddings for any wisdom rows that don't have one yet (e.g. the
 * seeded system wisdom, which is inserted without an embedding since it can
 * change independently of the embedding model). Runs once at startup.
 */
export async function backfillMissingEmbeddings(wisdomService) {
  const pending = wisdomService.findAllMissingEmbedding();
  if (pending.length === 0) return;
  console.log(`Backfilling embeddings for ${pending.length} wisdom entries...`);
  for (const wisdom of pending) {
    const embedding = await wisdomService.embeddingService.embed(wisdom.text);
    wisdomService.updateEmbedding(wisdom.id, embedding);
  }
  console.log('Embedding backfill complete.');
}
