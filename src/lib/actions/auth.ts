'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(formData: z.infer<typeof formSchema>) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword(formData);

  if (error) {
    console.error('Login error:', error.message);
    // In a real app, you would redirect to the login page with an error message.
    // e.g., redirect('/login?error=Could not authenticate user');
    return redirect('/login?error=Invalid credentials');
  }

  return redirect('/dashboard');
}

export async function signup(formData: z.infer<typeof formSchema>) {
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error('Signup error:', error.message);
    // Redirect with a generic error for security.
    return redirect('/signup?error=Could not create account');
  }

  // A confirmation email will be sent. The user needs to verify their email.
  // We can redirect them to a page that tells them this.
  return redirect('/login?message=Check your email to verify your account and log in.');
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect('/login');
}
