'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { Database } from './database.types';

/**
 * Checks if we're in a build context where cookies are not available
 */
const isBuildTime = () => {
  return process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL && !process.env.NEXT_RUNTIME;
};

/**
 * Gets the cookie store safely handling both sync and async implementations
 * This handles the latest Next.js 15+ cookies() implementation
 */
const getCookieStore = async (): Promise<ReadonlyRequestCookies | null> => {
  try {
    // Skip cookie access during build time
    if (isBuildTime()) {
      return null;
    }
    
    const cookieStore = cookies();
    // Handle async cookies implementation in Next.js 15+
    return cookieStore instanceof Promise ? await cookieStore : cookieStore;
  } catch (error) {
    console.error('Error getting cookie store:', error);
    // Return null instead of throwing during build time
    if (isBuildTime()) {
      return null;
    }
    throw new Error('Failed to access cookies. This might be due to incompatibility with Next.js version.');
  }
};

/**
 * Creates a Supabase client for server-side operations
 * Uses the latest @supabase/ssr patterns for Next.js server components
 */
export async function createDatabaseSupabaseClient() {
  // Validate required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  try {
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: async (name) => {
            try {
              const cookieStore = await getCookieStore();
              if (!cookieStore) return undefined; // Build time safety
              return cookieStore.get(name)?.value;
            } catch (error) {
              console.error(`Error getting cookie "${name}":`, error);
              return undefined;
            }
          },
          set: async (name, value, options) => {
            try {
              const cookieStore = await getCookieStore();
              if (!cookieStore) return; // Build time safety
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.error(`Error setting cookie "${name}":`, error);
            }
          },
          remove: async (name, options) => {
            try {
              const cookieStore = await getCookieStore();
              if (!cookieStore) return; // Build time safety
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              console.error(`Error removing cookie "${name}":`, error);
            }
          },
        },
        global: {
          fetch: fetch.bind(globalThis),
        },
      }
    );
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw new Error('Failed to initialize database connection');
  }
}
