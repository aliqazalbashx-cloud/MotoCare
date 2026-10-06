import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { getOrCreateFirebaseUser } from '../db/users.ts';

export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.AUTH_SECRET || 'motorcare-jwt-secret-key-2026-production';

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token is empty' });
  }

  // 1. Check if token is a MotorCare JWT token
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      uid: string;
      email: string;
    };

    if (payload && payload.userId) {
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (userList.length > 0) {
        const u = userList[0];
        req.user = {
          id: u.id,
          uid: u.uid,
          email: u.email,
          name: u.name,
          avatarUrl: u.avatarUrl,
        };
        return next();
      }
    }
  } catch (_jwtError) {
    // If not a valid JWT token, proceed to check Firebase ID token
  }

  // 2. Check if token is a Firebase ID token
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const email = decodedToken.email || `${decodedToken.uid}@firebase.motorcare.app`;
    const name = decodedToken.name || email.split('@')[0];
    const picture = decodedToken.picture || null;

    const dbUser = await getOrCreateFirebaseUser(
      decodedToken.uid,
      email,
      name,
      picture || undefined
    );

    req.user = {
      id: dbUser.id,
      uid: dbUser.uid,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
    };
    return next();
  } catch (firebaseError) {
    console.error('Auth verification error:', firebaseError);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication session' });
  }
};
