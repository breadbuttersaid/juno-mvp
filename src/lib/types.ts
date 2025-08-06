export type JournalEntry = {
  id: string;
  created_at: string;
  mood: 'happy' | 'excited' | 'neutral' | 'sad' | 'anxious' | 'grateful' | 'stressed' | 'tired' | 'calm' | 'inspired';
  content: string;
  ai_affirmation: string | null;
  user_id: string;
  updated_at?: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};
