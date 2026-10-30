import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { openDatabase } from './db.js';
import { errorHandler } from './errors.js';
import { requireAuth } from './middleware/auth.js';
import { createEmbeddingService } from './services/embeddingService.js';
import { AuthService } from './services/authService.js';
import { WisdomService } from './services/wisdomService.js';
import { SemanticSearchService } from './services/semanticSearchService.js';
import { backfillMissingEmbeddings } from './services/embeddingBackfill.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createWisdomRoutes } from './routes/wisdomRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// backend-node/src -> backend-node -> repo root, so local (non-Docker) dev
// shares the same top-level data/ and models/ directories as the rest of
// the project. In Docker these are always overridden via env vars.
const REPO_ROOT = path.join(__dirname, '..', '..');
const PORT = Number(process.env.PORT ?? 8080);
const DATA_DIR = process.env.APP_DATA_DIR ?? path.join(REPO_ROOT, 'data');
const MODELS_DIR = process.env.APP_MODELS_DIR ?? path.join(REPO_ROOT, 'models');
const STATIC_DIR = process.env.APP_STATIC_DIR ?? path.join(__dirname, '..', 'public');
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 24 * 7);

async function main() {
  const db = openDatabase(DATA_DIR);
  const embeddingService = await createEmbeddingService(MODELS_DIR);

  const authService = new AuthService(db, SESSION_TTL_HOURS);
  const wisdomService = new WisdomService(db, embeddingService);
  const semanticSearchService = new SemanticSearchService(wisdomService, embeddingService);

  await backfillMissingEmbeddings(wisdomService);

  const auth = requireAuth(db);
  const app = express();
  app.use(express.json());

  app.use('/api', createAuthRoutes({ authService, requireAuth: auth }));
  app.use('/api', createWisdomRoutes({ wisdomService, semanticSearchService, requireAuth: auth }));

  // Serve the built React frontend, if present (it is copied in during the
  // Docker build; in local dev the frontend runs separately via Vite).
  if (fs.existsSync(STATIC_DIR)) {
    app.use(express.static(STATIC_DIR));

    // SPA fallback: any non-API, non-static-asset path serves index.html so
    // the client-side router can take over. Mirrors the previous Java
    // WebConfig's regex-based view controller.
    const spaFallbackPattern = /^\/(?!api|assets|favicon\.svg|icons\.svg|index\.html).*/;
    app.get(spaFallbackPattern, (req, res) => {
      res.sendFile(path.join(STATIC_DIR, 'index.html'));
    });
  }

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Cat's Book of Wisdom backend listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
