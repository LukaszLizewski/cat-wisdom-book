import { UnauthorizedError } from '../errors.js';

/** Express middleware requiring a valid `Authorization: Bearer <token>` session. */
export function requireAuth(db) {
  return (req, res, next) => {
    const header = req.get('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(new UnauthorizedError('Missing or invalid Authorization header'));
    }

    const session = db
      .prepare(
        `SELECT s.user_id AS userId, u.profile_name AS profileName
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ?`
      )
      .get(token);

    if (!session) {
      return next(new UnauthorizedError('Session not found'));
    }
    const rawExpires = db.prepare('SELECT expires_at FROM sessions WHERE token = ?').get(token);
    if (new Date(rawExpires.expires_at).getTime() < Date.now()) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return next(new UnauthorizedError('Session has expired'));
    }

    req.currentUser = { id: session.userId, profileName: session.profileName };
    next();
  };
}
