import { Lucia } from 'lucia';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { Session, User as LuciaUser, Adapter } from 'lucia';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { User } from './types';

// MOCK ADAPTER - in a real app, use an adapter for your database
// e.g., @lucia-auth/adapter-prisma, @lucia-auth/adapter-drizzle
// This is an in-memory adapter for demonstration purposes.

const mockUsers: User[] = [
    { id: '1', email: 'user@example.com', password: 'password' },
    { id: '2', email: 'friend@example.com', password: 'password' },
];

const sessions = new Map<string, Omit<Session, 'fresh' | 'userId'> & { userId: string }>();
const users = new Map<string, User>(mockUsers.map(u => [u.id, u]));

const adapter: Adapter = {
  async getSessionAndUser(sessionId: string): Promise<[Session, LuciaUser] | [null, null]> {
    const session = sessions.get(sessionId);
    if (!session) return [null, null];
    
    const user = users.get(session.userId);
    if (!user) return [null, null];
    
    const { userId, ...sessionAttributes } = session;

    return [
        { id: sessionId, userId, fresh: false, ...sessionAttributes }, 
        { id: user.id, ...user }
    ];
  },
  async getUserSessions(userId: string): Promise<Session[]> {
    const userSessions: Session[] = [];
    sessions.forEach((session, sessionId) => {
        if (session.userId === userId) {
            userSessions.push({ id: sessionId, fresh: false, ...session });
        }
    });
    return userSessions;
  },
  async setSession(session: Session): Promise<void> {
    const { userId, ...sessionAttributes } = session;
    sessions.set(session.id, { userId, ...sessionAttributes });
  },
  async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      sessions.set(sessionId, { ...session, expiresAt });
    }
  },
  async deleteSession(sessionId: string): Promise<void> {
    sessions.delete(sessionId);
  },
  async deleteUserSessions(userId: string): Promise<void> {
    const sessionsToDelete: string[] = [];
    sessions.forEach((session, id) => {
        if (session.userId === userId) {
            sessionsToDelete.push(id);
        }
    });
    sessionsToDelete.forEach(id => sessions.delete(id));
  },
};


export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      id: attributes.id,
      email: attributes.email,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: Omit<User, 'password'>;
  }
}

export const getUserFromCookie = cache(async (cookieStore: ReadonlyRequestCookies) => {
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return null;

  const { user, session } = await lucia.validateSession(sessionId);

  try {
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
  } catch {
    // Next.js throws error when attempting to set cookies when rendering page
  }

  return user;
});