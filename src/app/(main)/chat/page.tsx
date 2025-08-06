'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { aiChat } from '@/ai/flows/ai-chat';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getJournalEntries } from '@/lib/actions/journal';
import type { JournalEntry } from '@/lib/types';

export default function ChatPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch journal entries on initial load
    const loadEntries = async () => {
      const entries = await getJournalEntries();
      setJournalEntries(entries);
    }
    loadEntries();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    startTransition(async () => {
      try {
        const previousEntries = journalEntries.map(e => ({
            id: e.id,
            date: e.created_at,
            mood: e.mood,
            text: e.content,
        }));
        
        const { response } = await aiChat({ userId: '1', message: input, previousEntries });
        const aiMessage: ChatMessage = { role: 'assistant', content: response };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error('Chat error:', error);
        toast({
          title: 'Error',
          description: 'Could not get a response from the AI. Please try again.',
          variant: 'destructive',
        });
        setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
      }
    });
  };

  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center gap-2">
          <Bot />
          AI Companion
        </CardTitle>
        <CardDescription>
          Talk about what's on your mind. Your AI friend is here to listen, reflect on your past entries, and help you explore your thoughts.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar>
                    <AvatarFallback className="bg-primary/20"><Bot className="text-primary-foreground" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-md rounded-lg px-4 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                 {message.role === 'user' && (
                  <Avatar>
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isPending && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar>
                  <AvatarFallback className="bg-primary/20"><Bot className="text-primary-foreground" /></AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isPending}
            autoComplete="off"
          />
          <Button type="submit" disabled={isPending || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
