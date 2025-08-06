export type JournalEntry = {
  id: string;
  created_at: string;
  mood: 'happy' | 'excited' | 'neutral' | 'sad' | 'anxious';
  content: string;
  ai_affirmation: string | null;
  user_id: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};
