import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateFirebaseUser(
  uid: string,
  email: string,
  name?: string,
  avatarUrl?: string
) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        avatarUrl: avatarUrl || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          avatarUrl: avatarUrl || null,
        },
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Failed to get or create Firebase user:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

export async function getUserById(id: number) {
  try {
    const res = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('Failed to get user by id:', error);
    throw new Error('Database query failed', { cause: error });
  }
}

export async function getUserByEmail(email: string) {
  try {
    const res = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('Failed to get user by email:', error);
    throw new Error('Database query failed', { cause: error });
  }
}
