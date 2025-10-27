import type { TMDBListResponse, TMDBMovie } from '@/types/movie'

/**
 * Centralized TMDB API configuration.
 * Uses Authorization: Bearer <token> header and JSON accept header for all requests.
 * The API key/token must be provided via VITE_TMDB_API_KEY environment variable.
 */
export const TMDB_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  API_KEY: import.meta.env.VITE_TMDB_API_KEY as string,
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY as string}`,
  } as HeadersInit,
} as const

/**
 * Internal GET helper with proper headers, query param handling, and error checks.
 * By default we use only the Authorization header; append api_key explicitly where required.
 */
async function httpGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const search = new URLSearchParams()
  // Only include defined params
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) search.append(k, String(v))
  })

  const url = `${TMDB_CONFIG.BASE_URL}${path}${search.toString() ? `?${search.toString()}` : ''}`
  const res = await fetch(url, {
    method: 'GET',
    headers: TMDB_CONFIG.headers,
  })

  if (!res.ok) {
    // Surface status and statusText for easier diagnostics
    throw new Error(`TMDB error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// PUBLIC_INTERFACE
export async function searchMovies(query: string): Promise<TMDBListResponse<TMDBMovie>> {
  /**
   * Search TMDB for movies by query string.
   * Uses Authorization header and does not require api_key query param.
   */
  return httpGet<TMDBListResponse<TMDBMovie>>('/search/movie', { query })
}

// PUBLIC_INTERFACE
export async function getTrending(): Promise<TMDBListResponse<TMDBMovie>> {
  /**
   * Get trending movies for the current week.
   * Endpoint: /trending/movie/week
   */
  return httpGet<TMDBListResponse<TMDBMovie>>('/trending/movie/week')
}

// PUBLIC_INTERFACE
export async function getFeatured(): Promise<TMDBListResponse<TMDBMovie>> {
  /**
   * Get featured movies.
   * Acceptable endpoints per spec: /discover/movie?sort_by=popularity.desc OR /movie/top_rated
   * Using top_rated here for a refined curated set.
   */
  return httpGet<TMDBListResponse<TMDBMovie>>('/movie/top_rated')
}

// PUBLIC_INTERFACE
export async function fetchMovieDetails(id: number): Promise<TMDBMovie> {
  /**
   * Fetch a single movie's details by id.
   * This call includes the api_key query parameter in addition to Authorization header
   * to satisfy the integration pattern requirement.
   */
  return httpGet<TMDBMovie>(`/movie/${id}`, { api_key: TMDB_CONFIG.API_KEY })
}

// Warn during development if the TMDB key is missing.
if (!TMDB_CONFIG.API_KEY) {
  console.warn(
    'VITE_TMDB_API_KEY is not set. TMDB features (search, trending, featured, details) will not work.',
  )
}
