import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.https://riwuurivktjjhosxyhks.supabase.co!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
