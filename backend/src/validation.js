import { z } from 'zod';
import { ValidationError } from './errors.js';

export const profileNameSchema = z
  .string({ required_error: 'Profile name is required' })
  .trim()
  .min(1, 'Profile name is required')
  .max(60, 'Profile name must be at most 60 characters');

export const pinSchema = z
  .string({ required_error: 'PIN is required' })
  .trim()
  .min(4, 'PIN must be at least 4 digits')
  .max(12, 'PIN must be at most 12 digits')
  .regex(/^\d+$/, 'PIN must contain digits only');

export const createProfileSchema = z.object({
  profileName: profileNameSchema,
  pin: pinSchema,
});

export const loginSchema = z.object({
  profileName: profileNameSchema,
  pin: pinSchema,
});

export const changePinSchema = z.object({
  currentPin: pinSchema,
  newPin: pinSchema,
});

export const wisdomInputSchema = z.object({
  text: z
    .string({ required_error: 'Text is required' })
    .trim()
    .min(1, 'Text is required')
    .max(500, 'Text must be at most 500 characters'),
  author: z.string().trim().max(120).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
});

export const semanticSearchSchema = z.object({
  query: z
    .string({ required_error: 'Query is required' })
    .trim()
    .min(1, 'Query is required')
    .max(300, 'Query must be at most 300 characters'),
});

/** Parses `schema` against `body`, throwing a 400 ValidationError with the first issue's message. */
export function parseOrThrow(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const [firstIssue] = result.error.issues;
    throw new ValidationError(firstIssue?.message ?? 'Invalid request');
  }
  return result.data;
}
