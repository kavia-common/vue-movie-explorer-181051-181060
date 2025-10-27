import type { TMDBListResponse, TMDBMovie } from '@/types/movie'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string
const BASE = 'https://api.themoviedb.org/3'

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const sp = new URLSearchParams({ api_key: API_KEY, language: 'en-US', ...params } as Record<string, string>)
  const res = await fetch(`${BASE}${path}?${sp.toString()}`)
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  return res.json() as Promise<T>
}

// PUBLIC_INTERFACE
export async function searchMovies(query: string): Promise<TMDBListResponse<TMDBMovie>> {
  /** Search TMDB for movies. */
  return get<TMDBListResponse<TMDBMovie>>('/search/movie', { query })
}

// PUBLIC_INTERFACE
export async function getTrending(): Promise<TMDBListResponse<TMDBMovie>> {
  /** Get trending movies this week. */
  return get<TMDBListResponse<TMDBMovie>>('/trending/movie/week')
}

// PUBLIC_INTERFACE
export async function getFeatured(): Promise<TMDBListResponse<TMDBMovie>> {
  /** Get featured/top-rated movies. */
  return get<TMDBListResponse<TMDBMovie>>('/movie/top_rated')
}
