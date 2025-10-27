# Architecture: Movie Explorer (Vue 3 + Vite + Tailwind)

## 1. System Overview
Movie Explorer is a single-page application built with Vue 3, Vite, TailwindCSS, Pinia, and Vue Router. It integrates with:
- Supabase for Google OAuth authentication, Postgres CRUD, and realtime (WebSocket) updates.
- TMDB API for search, trending, and featured movie data.

The app provides two primary routes:
- “/” LandingView.vue: Marketing/intro with transparent Navbar and sign-in CTA.
- “/app” AppShell.vue: Auth-aware app experience featuring search, trending, featured, and a per-user “Your Movies” panel.

ASCII overview:
```
+-----------------+            +---------------------------+
|     Browser     |<---------->|  Vue 3 SPA (Vite build)   |
| (User Agent)    |            |  - Vue Router             |
+--------+--------+            |  - Pinia (session,movies) |
         |                     +----+----------------------+
         |                           |
         |                           | HTTP(S) + WSS
         |                           v
         |                   +---------------------+
         |                   |     Supabase        |
         |                   | - Auth (Google)     |
         |                   | - Postgres (movies) |
         |                   | - Realtime (WS)     |
         |                   +---------------------+
         |
         |  HTTPS
         v
+---------------------+
|       TMDB API      |
| search/trending/top |
+---------------------+
```

## 2. Frontend Architecture: Vue 3 + Vite + Tailwind
The application is a client-rendered SPA using:
- Vue 3 SFCs for UI composition.
- Vite for dev server and optimized production builds.
- TailwindCSS for styling with an “Elegant Royal Purple” theme (tailwind.config.js).
- Pinia for centralized state management (session and movies stores).
- Vue Router for route definitions and lazy-loaded views.

Key configuration:
- Vite config: vite.config.ts sets Vue plugins, path aliases (@ -> src), and dev server options.
- CSP and security meta: index.html restricts allowed origins and features for dev/preview; production guidance is documented in securityImprovements.md.

## 3. Project Structure and Key Files
- src/main.ts: App bootstrap; creates Vue app, registers Pinia and Router, initializes session store.
- src/router/index.ts: Vue Router setup with lazy-loaded routes for LandingView, AppShell, and NotFound.
- src/lib/supabaseClient.ts: Supabase client creation; enables auth persistence and auto refresh; warns on missing env.
- src/services/tmdb.ts: Centralized TMDB API configuration and helpers (search, trending, featured, details).
- src/stores/session.ts: Session store—initialization, auth state listener, signInWithGoogle, and signOut.
- src/stores/movies.ts: Movies store—CRUD on public.movies, dedupe, optimistic updates, realtime subscribe/unsubscribe.
- src/views/AppShell.vue: Main application shell; wires search flow and composes FeaturedCarousel, TrendingGrid, YourMoviesPanel.
- src/views/LandingView.vue: Marketing landing with CTA to sign in or open the app.
- src/components/SearchBar.vue: Debounced search input; emits query events with loading affordances.
- src/components/TrendingGrid.vue: Trending grid or search results with skeleton loading.
- src/components/FeaturedCarousel.vue: Featured carousel with skeletons while loading.
- src/components/YourMoviesPanel.vue: Per-user saved movies list with remove actions and loading skeletons.
- src/components/MovieCard.vue: Movie card with Save action (auth gated, deduped, optimistic).
- src/types/movie.ts: TypeScript interfaces for Movie and TMDB responses.
- index.html: Meta CSP, Referrer-Policy, and Permissions-Policy.
- tailwind.config.js: Theme colors, shadows, and utilities consistent with Royal Purple style.
- performanceOptimization.md: Implemented and recommended performance techniques.
- vue-movie-explorer-181051-181060/securityImprovements.md: Production security hardening guidance.

## 4. Routing and Navigation
Routes are lazy-loaded to improve initial load performance (src/router/index.ts):
- “/” → LandingView.vue
- “/app” → AppShell.vue
- “/:pathMatch(.*)*” → NotFound.vue

The session store handles auth state globally. After successful Google OAuth, Supabase redirects back to /app (see session.ts redirectTo usage).

## 5. State Management (Pinia stores: session, movies)
- Session Store (src/stores/session.ts)
  - state: session, user, initialized, loading
  - actions:
    - init(): Loads current session and subscribes to auth changes via supabase.auth.onAuthStateChange.
    - signInWithGoogle(): Starts OAuth with redirect to window.location.origin + "/app".
    - signOut(): Signs out and clears local state.
- Movies Store (src/stores/movies.ts)
  - state: movies[], loading, channel (RealtimeChannel|null)
  - getters: isSaved(tmdbId) → boolean
  - actions:
    - load(): Loads current user’s movies ordered by created_at desc.
    - addFromTmdb()/addMovie(): Inserts new row; dedupes; optimistic update; ignores unique constraint errors.
    - remove(id)/removeByTmdbId(tmdbId): Deletes user’s row(s); optimistic removal.
    - subscribe(): Subscribes to realtime changes for current user (INSERT/UPDATE/DELETE).
    - unsubscribe(): Cleans up realtime channel.
  - Auth-driven lifecycle: A session.$subscribe handler reacts to user changes and triggers load/subscribe on login and unsubscribe/clear on logout.

## 6. External Services Integration (Supabase, TMDB) and env vars
Environment variables (.env) required by Vite (all prefixed with VITE_):
- VITE_SUPABASE_URL
- VITE_SUPABASE_KEY
- VITE_TMDB_API_KEY

Supabase (src/lib/supabaseClient.ts):
- createClient(VITE_SUPABASE_URL, VITE_SUPABASE_KEY) with persistent sessions, auto token refresh.
- Warns if env vars are missing.

TMDB (src/services/tmdb.ts):
- TMDB_CONFIG sets BASE_URL, Authorization: Bearer VITE_TMDB_API_KEY, and accept JSON headers.
- httpGet() handles headers, query params, and error surfaces (status + text).
- Public functions: searchMovies(query), getTrending(), getFeatured(), fetchMovieDetails(id with api_key param).

## 7. Data Model and Realtime Subscriptions
Frontend type (src/types/movie.ts):
- Movie: { id, user_id, title, tmdb_id?, poster_path?, created_at? }

Backend (see README.md and PRD.md for SQL and policies):
- Table public.movies with unique (user_id, tmdb_id); RLS restricts actions to row owner; realtime enabled.

Realtime (src/stores/movies.ts):
- Channel: 'public:movies'; filter: user_id=eq.${session.user.id}
- INSERT: Prepend if not already present by id or tmdb_id.
- UPDATE: Replace updated row by id.
- DELETE: Remove by id.

## 8. Request Flow Sequences
### Auth (Google OAuth via Supabase)
```
User -> Navbar/AuthButton -> session.signInWithGoogle()
session.signInWithGoogle -> Supabase OAuth -> Redirect -> /app
main.ts -> session.init() -> supabase.auth.getSession()
supabase.auth.onAuthStateChange -> session.user set
session.$subscribe -> movies.load() and movies.subscribe()
UI -> YourMoviesPanel reflects current user's rows
```

### Search (TMDB)
```
User types -> SearchBar (debounce 500ms) -> emits 'search(q)'
AppShell.onSearch(q) -> if empty: clear; else set searching=true
AppShell -> services/tmdb.searchMovies(q) -> HTTP GET /search/movie
TMDB -> JSON results -> AppShell sets results[] and searching=false
TrendingGrid (showSearch) -> renders results via MovieCard
```

### Trending / Featured (TMDB)
```
TrendingGrid.onMounted() -> getTrending() -> GET /trending/movie/week
FeaturedCarousel.onMounted() -> getFeatured() -> GET /movie/top_rated
Components show skeletons while loading, then render images with fade-in
```

### Save Movie (Supabase CRUD)
```
MovieCard 'Save' click -> movies.addMovie(tmdb)
movies.addMovie -> supabase.from('movies').insert({...}).select().single()
- On success: optimistic push to movies[] (deduped)
- On unique error: ignore (already saved)
UI button state: "Saving…" -> "Saved" (disabled)
```

### Realtime Updates (Supabase)
```
session.$subscribe (login) -> movies.load() -> movies.subscribe()
supabase.realtime:
  INSERT -> prepend if not duplicate
  UPDATE -> replace row by id
  DELETE -> remove by id
YourMoviesPanel reflects changes without manual refresh
```

## 9. Error Handling and Loading UX (including skeletons)
- TMDB errors: httpGet() throws “TMDB error: <status> <statusText>”; components catch at call sites (e.g., AppShell.vue), defaulting to non-intrusive feedback. 
- Supabase env: supabaseClient.ts logs a console warning if missing VITE_SUPABASE_URL/KEY; related features will not work.
- TMDB env: services/tmdb.ts warns if VITE_TMDB_API_KEY is missing; TMDB features disabled.
- Loading states:
  - Skeleton components: src/components/skeletons/SkeletonBlock.vue, SkeletonCard.vue, SkeletonGrid.vue used in AppShell, TrendingGrid, FeaturedCarousel, YourMoviesPanel.
  - aria-busy + role="status" used for accessible loading announcements.
  - SearchBar shows a spinner adornment while loading.
  - Images reserve aspect ratio to avoid layout shift and fade in when loaded.

## 10. Security Considerations (CSP, RLS, headers)
- CSP: index.html includes a meta Content-Security-Policy allowing only self, TMDB endpoints (api.themoviedb.org, image.tmdb.org), and Supabase (*.supabase.co) plus ws/wss for dev/HMR.
- Referrer-Policy and Permissions-Policy meta present; see index.html for details.
- RLS: Backend policies restrict public.movies operations to the authenticated row owner, with unique index (user_id, tmdb_id).
- Production hardening: See vue-movie-explorer-181051-181060/securityImprovements.md for HTTP header examples (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) and stricter CSP pinning (eliminate generic ws:; pin Supabase to exact project host).

## 11. Performance Considerations
Implemented practices (see performanceOptimization.md):
- Route-level code splitting (lazy views in router/index.ts).
- Skeleton loaders and shimmer to reduce perceived latency.
- Debounced search (SearchBar.vue) to limit redundant requests.
- Reserved image aspect ratios and fade-in to reduce CLS.
- Accessible loading states with aria-busy and role="status".

Next steps (future-ready; see performanceOptimization.md for examples):
- AbortController-based cancellation for search requests.
- In-memory TTL cache for trending/featured.
- Responsive images with srcset/sizes and decoding="async".
- Pagination and selected columns for Supabase queries.
- Bundle analysis (rollup-plugin-visualizer) and async-loading heavy components.

## 12. Deployment and Configuration Notes
- Environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_KEY, VITE_TMDB_API_KEY.
- OAuth: Configure Supabase “Site URL” and Additional Redirect URLs to include <origin> and <origin>/app.
- Build and run:
  - npm run dev → Vite dev server (vite.config.ts sets host/port and CORS).
  - npm run build → type-check then Vite build.
  - npm run preview → preview production build.
- CSP: Meta works for dev/preview; enforce as HTTP headers in production (see securityImprovements.md). Remove generic ws: in production unless necessary.
- Hosting: Any static hosting (Vercel/Netlify/NGINX/CDN) can serve dist/; ensure headers are configured and env vars are injected at build time.

## 13. Future Extensions
- Details view/modal using services/tmdb.fetchMovieDetails.
- Request cancellation and in-flight dedupe for search.
- Web Vitals telemetry and structured analytics (update CSP accordingly).
- Image responsiveness and further component-level lazy-loading.
- Pagination and “Load more” for saved movies.
- Hardened production security headers and refined CSP pinning.

## Appendix: ASCII component and sequence diagrams

### A. Component Composition (AppShell)
```
AppShell.vue
  ├─ Navbar
  ├─ SearchBar    (debounce; emits 'search')
  ├─ FeaturedCarousel   (onMounted -> getFeatured)
  ├─ TrendingGrid       (onMounted -> getTrending OR renders search results)
  └─ YourMoviesPanel    (Pinia movies store; realtime updates)
```

### B. Session and Movies Stores (Pinia)
```
useSessionStore (session.ts)
  state: session, user, initialized, loading
  actions: init(), signInWithGoogle(), signOut()
  events: onAuthStateChange -> update session/user

useMoviesStore (movies.ts)
  state: movies[], loading, channel
  getters: isSaved(tmdbId)
  actions: load(), addMovie()/addFromTmdb(), remove(), removeByTmdbId(), subscribe(), unsubscribe()
  auth lifecycle: session.$subscribe -> load & subscribe on login; unsubscribe & clear on logout
```

### C. Auth Flow (Google OAuth via Supabase)
```
[User]
  |
  | click "Sign in with Google"
  v
[AuthButton.vue] -> useSessionStore.signInWithGoogle()
  |
  v
[Supabase OAuth] -- redirects -->
  |
  v
[/app route]
  |
  v
[src/main.ts] -> session.init() -> supabase.auth.getSession()
  |
  v
[session.ts onAuthStateChange] -> user set -> movies.load() & movies.subscribe()
```

### D. Search Flow (TMDB)
```
[User] -> [SearchBar.vue] --debounce--> emits 'search(q)'
  |
  v
[AppShell.onSearch] --async--> services/tmdb.searchMovies(q)
  |
  |  GET https://api.themoviedb.org/3/search/movie (Authorization: Bearer <V4 token>)
  v
[TMDB response] -> results[]
  |
  v
[TrendingGrid.vue (showSearch=true)] -> renders MovieCard list
```

### E. Save Movie + Realtime
```
[MovieCard.vue] 'Save' click
  |
  v
[movies.addMovie(tmdb)]
  |
  |  INSERT into public.movies with (user_id, title, tmdb_id, poster_path)
  v
[Supabase] -> returns inserted row
  |
  v
[movies store] optimistic add (dedupe)
  |
  v
[Supabase Realtime] INSERT event (user-filtered)
  |
  v
[movies.subscribe handler] -> ensure row present (deduped)
  |
  v
[YourMoviesPanel] reflects latest state
```

### F. Configuration and Security Anchors
```
index.html
  - CSP meta (self, *.supabase.co, api.themoviedb.org, image.tmdb.org, ws/wss for dev)
  - Referrer-Policy, Permissions-Policy

vite.config.ts
  - Vue plugins, alias "@": "src", dev server (host, port, headers)

tailwind.config.js
  - Theme colors, gradients, shadows (Royal Purple)
```
