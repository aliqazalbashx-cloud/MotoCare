import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import { requireAuth, AuthRequest } from '../../middleware/auth.ts';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  getValidationError,
} from '../../lib/validation.ts';

export const authRouter = express.Router();
const JWT_SECRET = process.env.AUTH_SECRET || 'motorcare-jwt-secret-key-2026-production';

/**
 * Register a new user with email and password
 */
authRouter.post('/register', async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const { name, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
      })
      .returning();

    const newUser = inserted[0];
    const token = jwt.sign(
      { userId: newUser.id, uid: newUser.uid, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        uid: newUser.uid,
        email: newUser.email,
        name: newUser.name,
        avatarUrl: newUser.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * Login with email and password
 */
authRouter.post('/login', async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (foundUsers.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = foundUsers[0];
    if (!user.passwordHash) {
      return res.status(401).json({
        error: 'This account was created with Google Sign-In. Please sign in with Google.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, uid: user.uid, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * Get current authenticated user
 */
authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.json({ user: req.user });
  } catch (error) {
    console.error('Fetch me error:', error);
    return res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

/**
 * Update profile name
 */
authRouter.put('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const updated = await db
      .update(users)
      .set({
        name: parseResult.data.name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.id))
      .returning();

    const u = updated[0];
    return res.json({
      user: {
        id: u.id,
        uid: u.uid,
        email: u.email,
        name: u.name,
        avatarUrl: u.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

/**
 * Change password
 */
authRouter.put('/password', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: getValidationError(parseResult.error),
      });
    }

    const { currentPassword, newPassword } = parseResult.data;

    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!userRecord[0]) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const u = userRecord[0];
    if (u.passwordHash) {
      const match = await bcrypt.compare(currentPassword, u.passwordHash);
      if (!match) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.id));

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});
