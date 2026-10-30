import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { ConflictError, UnauthorizedError } from '../errors.js';

const BCRYPT_ROUNDS = 10;

/**
 * Handles profile creation, login, and PIN changes using a custom opaque
 * bearer-token session (no JWT/OAuth) - mirrors the original design.
 */
export class AuthService {
  constructor(db, sessionTtlHours) {
    this.db = db;
    this.sessionTtlHours = sessionTtlHours;
  }

  createProfile(profileName, pin) {
    const existing = this.db.prepare('SELECT id FROM users WHERE profile_name = ?').get(profileName);
    if (existing) {
      throw new ConflictError('A profile with this name already exists');
    }
    const pinHash = bcrypt.hashSync(pin, BCRYPT_ROUNDS);
    const info = this.db
      .prepare('INSERT INTO users (profile_name, pin_hash) VALUES (?, ?)')
      .run(profileName, pinHash);
    return this.issueSession(info.lastInsertRowid, profileName);
  }

  login(profileName, pin) {
    const user = this.db
      .prepare('SELECT id, profile_name, pin_hash FROM users WHERE profile_name = ?')
      .get(profileName);
    if (!user || !bcrypt.compareSync(pin, user.pin_hash)) {
      throw new UnauthorizedError('Invalid profile name or PIN');
    }
    return this.issueSession(user.id, user.profile_name);
  }

  changePin(userId, currentPin, newPin) {
    const user = this.db.prepare('SELECT id, profile_name, pin_hash FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new UnauthorizedError('User does not exist');
    }
    if (!bcrypt.compareSync(currentPin, user.pin_hash)) {
      throw new UnauthorizedError('Current PIN is incorrect');
    }
    const newHash = bcrypt.hashSync(newPin, BCRYPT_ROUNDS);
    this.db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(newHash, userId);
    // Invalidate existing sessions so a stolen/old token can't outlive a PIN
    // change, then issue a fresh one so the current client stays logged in.
    this.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    return this.issueSession(userId, user.profile_name);
  }

  issueSession(userId, profileName) {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.sessionTtlHours * 3600_000);
    this.db
      .prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
      .run(token, userId, expiresAt.toISOString());
    return { token, profileName };
  }
}
