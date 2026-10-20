// Calling Edge Functions. Our functions reply { error: "plain English" } on failure; surface that text.
import { getSupabase } from '@/core/supabase';

export async function callFunction<T>(name: string, body: unknown, fallbackError = 'Something went wrong. Please try again.'): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) {
    const response = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    const parsed = response?.json ? await response.json().catch(() => null) : null;
    throw new Error(parsed?.error ?? fallbackError);
  }
  return data as T;
}
