export type JournalEntry = {
  id: string;
  created_at: string;
  mood: 'happy' | 'sad' | 'neutral';
  content: string;
  ai_affirmation: string | null;
  user_id: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// Supabase generates its own types, but we can define a user profile type if needed for our app logic.
export type UserProfile = {
  id: string;
  email: string;
  // any other profile fields
};
