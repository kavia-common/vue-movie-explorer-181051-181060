import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import { useSessionStore } from './session'
import type { Movie, TMDBMovie } from '@/types/movie'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useMoviesStore = defineStore('movies', {
  state: () => ({
    movies: [] as Movie[],
    loading: false,
    channel: null as RealtimeChannel | null,
  }),
  getters: {
    // PUBLIC_INTERFACE
    isSaved: (state) => (tmdbId: number) => state.movies.some((m) => m.tmdb_id === tmdbId),
  },
  actions: {
    // PUBLIC_INTERFACE
    async load(): Promise<void> {
      /** Load current user's movies. */
      const session = useSessionStore()
      if (!session.user) {
        this.movies = []
        return
      }
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.movies = (data as Movie[]) ?? []
      } finally {
        this.loading = false
      }
    },

    // PUBLIC_INTERFACE
    async addFromTmdb(tmdb: TMDBMovie): Promise<void> {
      /**
       * Insert a movie based on TMDB data for current user.
       * - Prevent duplicates by checking existing state.
       * - Optimistically update local state for instant UI feedback.
       * - Also safe against real-time duplication.
       */
      const session = useSessionStore()
      if (!session.user) return

      // Avoid duplicate writes if already saved
      if (this.isSaved(tmdb.id)) return

      // Perform insert and return inserted row for optimistic update
      const { data, error } = await supabase
        .from('movies')
        .insert({
          user_id: session.user.id,
          title: tmdb.title,
          tmdb_id: tmdb.id,
          poster_path: tmdb.poster_path,
        } satisfies Partial<Movie>)
        .select()
        .single()

      if (error) {
        // If the backend enforces a unique constraint, ignore duplicate errors gracefully
        // Otherwise rethrow to be handled by the caller
        const msg = (error.message ?? '').toLowerCase()
        if (msg.includes('duplicate') || msg.includes('unique')) {
          return
        }
        throw error
      }

      // Optimistic local update while realtime catches up (deduped below)
      if (data) {
        const existsById = this.movies.some((m) => m.id === data.id)
        const existsByTmdb = data.tmdb_id ? this.isSaved(data.tmdb_id) : false
        if (!existsById && !existsByTmdb) {
          this.movies = [data as Movie, ...this.movies]
        }
      }
    },

    // PUBLIC_INTERFACE
    async addMovie(tmdb: TMDBMovie): Promise<void> {
      /**
       * Alias for addFromTmdb to align with expected public API naming in components.
       * Accepts TMDBMovie payload and persists for the current user.
       */
      return this.addFromTmdb(tmdb)
    },

    // PUBLIC_INTERFACE
    async remove(id: string | number): Promise<void> {
      /** Remove a movie by row id. */
      const session = useSessionStore()
      if (!session.user) return
      const { error } = await supabase.from('movies').delete().eq('id', id).eq('user_id', session.user.id)
      if (error) throw error
      // Optimistically remove from local state (realtime will also handle it)
      this.movies = this.movies.filter((m) => m.id !== id)
    },

    // PUBLIC_INTERFACE
    async removeByTmdbId(tmdbId: number): Promise<void> {
      /** Remove a movie by TMDB id for the current user. */
      const session = useSessionStore()
      if (!session.user) return
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('user_id', session.user.id)
        .eq('tmdb_id', tmdbId)
      if (error) throw error
      // Optimistically remove from local state
      this.movies = this.movies.filter((m) => m.tmdb_id !== tmdbId)
    },

    // PUBLIC_INTERFACE
    subscribe(): void {
      /** Subscribe to real-time changes for current user's movies. */
      this.unsubscribe()

      const session = useSessionStore()
      if (!session.user) return

      this.channel = supabase
        .channel('public:movies')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'movies', filter: `user_id=eq.${session.user.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const inserted = payload.new as Movie
              const existsById = this.movies.some((m) => m.id === inserted.id)
              const existsByTmdb = inserted.tmdb_id ? this.isSaved(inserted.tmdb_id) : false
              if (!existsById && !existsByTmdb) {
                this.movies = [inserted, ...this.movies]
              }
            } else if (payload.eventType === 'DELETE') {
              const del = payload.old as Movie
              this.movies = this.movies.filter((m) => m.id !== del.id)
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Movie
              this.movies = this.movies.map((m) => (m.id === updated.id ? updated : m))
            }
          },
        )
        .subscribe()
    },

    // PUBLIC_INTERFACE
    async unsubscribe(): Promise<void> {
      /** Unsubscribe from real-time movies channel. */
      if (this.channel) {
        await this.channel.unsubscribe()
        this.channel = null
      }
    },
  },
})

// Auto-manage subscription based on auth changes
const session = useSessionStore()
session.$subscribe(async (_mutation, state) => {
  const store = useMoviesStore()
  if (state.user) {
    await store.load()
    store.subscribe()
  } else {
    store.unsubscribe()
    store.movies = []
  }
})
