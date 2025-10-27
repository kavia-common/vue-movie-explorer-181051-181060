# vue-kavia

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

---

## Environment variables

Create a `.env` file at the project root (see `.env.example` for a template) and provide:

- VITE_SUPABASE_URL
- VITE_SUPABASE_KEY
- VITE_TMDB_API_KEY

> Note: VITE_TMDB_API_KEY should be a TMDB API credential. A TMDB v4 Read Access Token (Bearer) is recommended. We also append it as `api_key` for specific endpoints as required by our integration pattern.

Example:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_TMDB_API_KEY=your_tmdb_token_or_key
```

## TMDB integration pattern

All TMDB requests are made using a single, centralized configuration exported from `src/services/tmdb.ts`:

- Base URL: `https://api.themoviedb.org/3`
- Headers:
  - `accept: application/json`
  - `Authorization: Bearer <VITE_TMDB_API_KEY>`
- For the movie details endpoint we also include the `api_key` query parameter.

The following functions are available:

- `searchMovies(query: string)` → `GET /search/movie?query=...`
- `getTrending()` → `GET /trending/movie/week`
- `getFeatured()` → `GET /movie/top_rated` (or `/discover/movie?sort_by=popularity.desc`)
- `fetchMovieDetails(id: number)` → `GET /movie/{id}?api_key=<VITE_TMDB_API_KEY>`

All requests check `response.ok` and throw a descriptive error on failure.

## Notes

- If `VITE_TMDB_API_KEY` is missing, a warning is logged and TMDB features will not function.
- Supabase environment variables are required for authentication and real-time features.
