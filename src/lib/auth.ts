import { Lucia } from 'lucia';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { Session, User as LuciaUser } from 'lucia';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

import { NodeNextRequestAdapter } from 'lucia/oslo/adapters';
import type { User } from './types';

// MOCK ADAPTER - in a real app, use an adapter for your database
// e.g., @lucia-auth/adapter-prisma, @lucia-auth/adapter-drizzle
const adapter = {
  async getSessionAndUser(sessionId: string) {
    const mockUsers: User[] = [
      { id: '1', email: 'user@example.com', password: 'password' },
      { id: '2', email: 'friend@example.com', password: 'password' },
    ];

    // This is a simplified mock. Lucia's real power comes from a proper DB session store.
    // Here we are just pretending to validate the session. A real adapter would query the DB.
    // We are decoding the session ID to find the user ID. THIS IS NOT SECURE FOR PRODUCTION.
    try {
        const userId = JSON.parse(atob(sessionId.split('.')[0])).sub;
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
             const session: Session = {
                id: sessionId,
                userId: user.id,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                fresh: false,
             };
             return [session, user as LuciaUser];
        }
    } catch (e) {
        // ignore error
    }
    return [null, null];
  },
  async getUserSessions(userId: string) { return [] },
  async setSession(session: Session) {},
  async updateSessionExpiration(sessionId: string, expiresAt: Date) {},
  async deleteSession(sessionId: string) {},
  async deleteUserSessions(userId: string) {},
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
      email: attributes.email,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: Omit<User, 'id'>;
  }
}

export const getUserFromCookie = cache(async (cookieStore: ReadonlyRequestCookies) => {
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) return null;

  const { user, session } = await lucia.validateSession(sessionId);

  try {
    if (session && session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    if (!session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
  } catch {
    // Next.js throws error when attempting to set cookies when rendering page
  }

  return user;
});
