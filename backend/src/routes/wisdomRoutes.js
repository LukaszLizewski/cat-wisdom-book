import { Router } from 'express';
import { parseOrThrow, wisdomInputSchema, semanticSearchSchema } from '../validation.js';
import { toWisdomResponse } from '../services/wisdomService.js';

// Express 4 does not forward rejected promises from async handlers to the
// error middleware automatically - wrap every async route with this.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function createWisdomRoutes({ wisdomService, semanticSearchService, requireAuth }) {
  const router = Router();
  router.use(requireAuth);

  // GET /api/wisdom?q=... - full-text search when q is present, otherwise all visible wisdom.
  router.get('/wisdom', (req, res) => {
    const userId = req.currentUser.id;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const results = q ? wisdomService.fullTextSearch(q, userId) : wisdomService.listVisible(userId);
    res.json(results.map((w) => toWisdomResponse(w, userId)));
  });

  router.get('/wisdom/random', (req, res) => {
    const userId = req.currentUser.id;
    const wisdom = wisdomService.getRandom(userId);
    res.json(toWisdomResponse(wisdom, userId));
  });

  router.get('/wisdom/:id', (req, res) => {
    const userId = req.currentUser.id;
    const wisdom = wisdomService.get(Number(req.params.id), userId);
    res.json(toWisdomResponse(wisdom, userId));
  });

  router.post('/wisdom', asyncHandler(async (req, res) => {
    const userId = req.currentUser.id;
    const { text, author, category } = parseOrThrow(wisdomInputSchema, req.body);
    const wisdom = await wisdomService.create(text, author, category, userId);
    res.status(201).json(toWisdomResponse(wisdom, userId));
  }));

  router.put('/wisdom/:id', asyncHandler(async (req, res) => {
    const userId = req.currentUser.id;
    const { text, author, category } = parseOrThrow(wisdomInputSchema, req.body);
    const wisdom = await wisdomService.update(Number(req.params.id), text, author, category, userId);
    res.json(toWisdomResponse(wisdom, userId));
  }));

  router.delete('/wisdom/:id', (req, res) => {
    const userId = req.currentUser.id;
    wisdomService.delete(Number(req.params.id), userId);
    res.status(204).send();
  });

  // POST /api/search/semantic - embedding-based similarity search.
  router.post('/search/semantic', asyncHandler(async (req, res) => {
    const userId = req.currentUser.id;
    const { query } = parseOrThrow(semanticSearchSchema, req.body);
    const results = await semanticSearchService.search(query, userId);
    res.json(
      results.map(({ wisdom, score }) => ({ wisdom: toWisdomResponse(wisdom, userId), score }))
    );
  }));

  return router;
}
