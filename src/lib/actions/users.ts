'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { lucia } from '@/lib/auth';
import type { User } from '../types';

// This is a mock database. In a real application, you would use a proper database like PostgreSQL, MySQL, etc.
const mockUsers: User[] = [
  { id: '1', email: 'user@example.com', password: 'password' },
  { id: '2', email: 'friend@example.com', password: 'password' },
];

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(
  values: z.infer<typeof loginSchema>
): Promise<{ error?: string; success?: string }> {
  try {
    const { email, password } = loginSchema.parse(values);

    const existingUser = mockUsers.find((user) => user.email === email);
    if (!existingUser || existingUser.password !== password) {
      return { error: 'Incorrect email or password' };
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return { success: 'Logged in successfully!' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(', ') };
    }
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}


export async function signup(
  values: z.infer<typeof loginSchema>
): Promise<{ error?: string; success?: string }> {
    try {
        const { email, password } = loginSchema.parse(values);

        const existingUser = mockUsers.find((user) => user.email === email);
        if (existingUser) {
            return { error: 'An account with this email already exists.' };
        }

        const newId = String(mockUsers.length + 1);
        const newUser: User = {
            id: newId,
            email,
            password, // In a real app, hash and salt the password!
        };

        mockUsers.push(newUser);
        
        // This is a hack for the in-memory adapter to know about the new user.
        // In a real DB adapter, this would not be needed.
        // @ts-ignore
        lucia.adapter.users.set(newId, newUser);


        const session = await lucia.createSession(newUser.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        return { success: 'Account created successfully!' };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { error: error.errors.map((e) => e.message).join(', ') };
        }
        console.error('Signup error:', error);
        return { error: 'An unexpected error occurred.' };
    }
}


export async function logout(): Promise<{ error?: string; success?: string }> {
  try {
    const sessionCookie = lucia.createBlankSessionCookie();
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return { success: 'Logged out successfully' };
  } catch (error) {
    return { error: 'An unexpected error occurred.' };
  }
}
