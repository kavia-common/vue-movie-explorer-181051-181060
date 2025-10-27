import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

export const useSessionStore = defineStore('session', {
  state: () => ({
    session: null as Session | null,
    user: null as User | null,
    initialized: false,
  }),
  actions: {
    // PUBLIC_INTERFACE
    async init(): Promise<void> {
      /** Initialize session and subscribe to auth changes. */
      const { data } = await supabase.auth.getSession()
      this.session = data.session
      this.user = data.session?.user ?? null

      supabase.auth.onAuthStateChange((_event, newSession) => {
        this.session = newSession
        this.user = newSession?.user ?? null
      })

      this.initialized = true
    },

    // PUBLIC_INTERFACE
    async signInWithGoogle(): Promise<void> {
      /** Start Google OAuth sign-in flow. */
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/app',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
    },

    // PUBLIC_INTERFACE
    async signOut(): Promise<void> {
      /** Sign out current user. */
      await supabase.auth.signOut()
    },
  },
})
