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
      /** Insert a movie based on TMDB data for current user. */
      const session = useSessionStore()
      if (!session.user) return

      const { error } = await supabase.from('movies').insert({
        user_id: session.user.id,
        title: tmdb.title,
        tmdb_id: tmdb.id,
        poster_path: tmdb.poster_path,
      } satisfies Partial<Movie>)
      if (error) throw error
    },

    // PUBLIC_INTERFACE
    async remove(id: string | number): Promise<void> {
      /** Remove a movie by row id. */
      const session = useSessionStore()
      if (!session.user) return
      const { error } = await supabase.from('movies').delete().eq('id', id).eq('user_id', session.user.id)
      if (error) throw error
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
              this.movies = [payload.new as Movie, ...this.movies]
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
