import { Router } from 'express';
import { parseOrThrow, createProfileSchema, loginSchema, changePinSchema } from '../validation.js';

export function createAuthRoutes({ authService, requireAuth }) {
  const router = Router();

  // POST /api/profiles - create a new local profile (name + PIN), no auth required.
  router.post('/profiles', (req, res) => {
    const { profileName, pin } = parseOrThrow(createProfileSchema, req.body);
    const { token } = authService.createProfile(profileName, pin);
    res.status(201).json({ token });
  });

  // POST /api/auth/login - no auth required.
  router.post('/auth/login', (req, res) => {
    const { profileName, pin } = parseOrThrow(loginSchema, req.body);
    const { token } = authService.login(profileName, pin);
    res.status(200).json({ token });
  });

  // POST /api/auth/change-pin - requires a valid bearer session.
  router.post('/auth/change-pin', requireAuth, (req, res) => {
    const { currentPin, newPin } = parseOrThrow(changePinSchema, req.body);
    authService.changePin(req.currentUser.id, currentPin, newPin);
    res.status(204).send();
  });

  return router;
}
