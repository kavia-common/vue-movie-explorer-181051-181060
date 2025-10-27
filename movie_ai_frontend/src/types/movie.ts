export interface Movie {
  id: string | number
  user_id: string
  title: string
  tmdb_id?: number
  poster_path?: string | null
  created_at?: string
}

export interface TMDBMovie {
  id: number
  title: string
  overview?: string
  release_date?: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number
}

export interface TMDBListResponse<T> {
  page?: number
  results: T[]
  total_pages?: number
  total_results?: number
}
