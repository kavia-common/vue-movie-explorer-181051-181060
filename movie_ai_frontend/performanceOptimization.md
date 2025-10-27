# Performance Optimization Guide

## Overview
This document summarizes the performance improvements currently implemented in the Movie Explorer app and explains why they help both real and perceived performance. It also outlines concrete next steps to further optimize the application, including code-splitting, network request efficiency, responsive image handling, Supabase query efficiency, bundle analysis, and Tailwind configuration hygiene. The guidance is specific to this codebase and references actual files and patterns used in the app.

## Implemented Optimizations
### Skeleton loaders and shimmer placeholders
The UI uses dedicated skeleton components and utilities to render elegant placeholders while data is loading. These provide immediate visual feedback and reduce perceived waiting time.
- Skeleton components: `src/components/skeletons/SkeletonBlock.vue`, `src/components/skeletons/SkeletonCard.vue`, `src/components/skeletons/SkeletonGrid.vue`
- Shimmer animation and base styles: `src/assets/tailwind.css` (`.skeleton` utility and `@keyframes shimmer`)
- Usage examples: 
  - `src/views/AppShell.vue` (app boot skeletons, grid placeholders)
  - `src/components/TrendingGrid.vue` (grid skeletons while fetching)
  - `src/components/FeaturedCarousel.vue` (card skeletons in carousel)
  - `src/components/YourMoviesPanel.vue` (skeleton grid in “Your Movies”)

### aria-busy and accessible loading states
While fetching, sections set `aria-busy="true"` and provide polite live regions. This improves accessibility and helps assistive technologies announce loading status without being intrusive.
- Examples: 
  - `src/views/AppShell.vue` sets `aria-busy` during app boot and searches
  - `src/components/TrendingGrid.vue`, `src/components/FeaturedCarousel.vue`, `src/components/YourMoviesPanel.vue`, `src/components/SearchBar.vue` show `role="status"` and visually hidden “Loading…” labels

### Aspect ratio placeholders to avoid layout shift
Images reserve a 2:3 poster aspect ratio using `pt-[150%]` wrappers so the layout does not jump when actual images load. This reduces CLS significantly on image-heavy screens.
- Examples: 
  - `src/components/MovieCard.vue`, `src/components/TrendingGrid.vue`, `src/components/FeaturedCarousel.vue`, `src/components/YourMoviesPanel.vue` (wrappers with `relative w-full pt-[150%]`)

### Fade-in for images
Images use an unobtrusive fade-in to improve perceived smoothness when assets become available, avoiding abrupt changes in visual content.
- Examples:
  - `src/components/MovieCard.vue` uses a `fade-in` utility (`src/assets/tailwind.css`) plus a temporary `.skeleton` overlay until the image `load` event
  - `src/components/FeaturedCarousel.vue`, `src/components/YourMoviesPanel.vue` also use the `fade-in` utility

### Debounced search to limit work and chatter
The search input is debounced in `src/components/SearchBar.vue` to reduce repeated fetches and re-rendering during rapid typing, improving responsiveness under real network conditions.

### Route-level code splitting (lazy-loaded views)
The router lazy-loads major routes using dynamic imports to split bundles by route. This improves initial load by deferring non-critical code.
- Implemented in `src/router/index.ts` via `const LandingView = () => import('../views/LandingView.vue')`, etc.

## How They Improve Performance
Skeletons and shimmer reduce perceived latency by immediately showing structure while content arrives, which helps users understand that work is in progress. Accessible status announcements (`aria-busy`, `role="status"`, `aria-live`) ensure screen reader users receive appropriate feedback without extra DOM churn.

Aspect ratio placeholders materially reduce Cumulative Layout Shift (CLS) by reserving space before images load. This is especially impactful on mobile networks and slower devices where images stream in gradually. Combined with fade-in, this creates a smoother visual experience.

Debounced search prevents redundant network requests and unnecessary re-renders when the user is typing, which lowers Total Blocking Time (TBT) and improves Interaction to Next Paint (INP) under real-world usage.

Lastly, route-level code-splitting ensures the initial bundle only includes code necessary to render the first screen. Subsequent screens are loaded on demand, improving First Contentful Paint (FCP) and Largest Contentful Paint (LCP) for the initial route.

## Code References
The following files contain the implemented patterns described above:
- Skeletons and shimmer: `src/components/skeletons/SkeletonBlock.vue`, `src/components/skeletons/SkeletonCard.vue`, `src/components/skeletons/SkeletonGrid.vue`, backed by utilities in `src/assets/tailwind.css`.
- Section-level loading with `aria-busy`: `src/views/AppShell.vue`, `src/components/TrendingGrid.vue`, `src/components/FeaturedCarousel.vue`, `src/components/YourMoviesPanel.vue`, `src/components/SearchBar.vue`.
- Aspect ratio placeholders and fade-in: `src/components/MovieCard.vue` (skeleton overlay while `@load` toggles visibility), `src/components/FeaturedCarousel.vue`, `src/components/YourMoviesPanel.vue`.
- Debounced search: `src/components/SearchBar.vue`.
- Session-aware boot and loading states: `src/stores/session.ts`, used by `src/views/AppShell.vue` (`appBootLoading`).
- Route-level code splitting: `src/router/index.ts`.
- Tailwind configuration (purge/content config and theme): `tailwind.config.js`.
- TMDB service (centralized fetch helper): `src/services/tmdb.ts`.

## Recommended Next Optimizations (with brief how-to)
The items below are concrete, incremental enhancements. Each recommendation includes a brief implementation approach and example code.

### 1) Component-level lazy loading for heavy sections
Route-level code splitting is already implemented. Further defer non-critical components (e.g., FeaturedCarousel) using `defineAsyncComponent` to cut initial route JS.
```ts
// Example: lazy register FeaturedCarousel in a view
import { defineAsyncComponent } from 'vue'
const FeaturedCarousel = defineAsyncComponent(() => import('@/components/FeaturedCarousel.vue'))
```
Use within template as usual; Vue will load it on demand.

### 2) TMDB request cancellation (AbortController) and in-flight dedupe
When users type quickly, cancel stale searches to avoid wasted work and flicker. Add a `signal` option to HTTP helpers and wire up an `AbortController` from the caller.
```ts
// src/services/tmdb.ts (extend httpGet)
async function httpGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  opts: { signal?: AbortSignal } = {},
): Promise<T> {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v != null && search.append(k, String(v)))
  const url = `${TMDB_CONFIG.BASE_URL}${path}${search.toString() ? `?${search.toString()}` : ''}`
  const res = await fetch(url, { method: 'GET', headers: TMDB_CONFIG.headers, signal: opts.signal })
  if (!res.ok) throw new Error(`TMDB error: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

// Pass optional opts through service methods (example)
export async function searchMovies(query: string, opts: { signal?: AbortSignal } = {}) {
  return httpGet('/search/movie', { query }, opts)
}
```
```ts
// src/views/AppShell.vue (search handler with cancellation)
let currentCtrl: AbortController | null = null

async function onSearch(q: string) {
  query.value = q
  if (!q) { results.value = []; searching.value = false; currentCtrl?.abort(); return }
  currentCtrl?.abort()
  currentCtrl = new AbortController()
  searching.value = true
  try {
    const res = await searchMovies(q, { signal: currentCtrl.signal })
    results.value = res.results || []
  } catch (e) {
    // Ignore AbortError intentionally
  } finally {
    searching.value = false
  }
}
```

### 3) Lightweight in-memory caching for TMDB responses (with TTL)
Cache popular endpoints like trending/featured to avoid repeated requests within a short window.
```ts
// src/services/tmdb.ts (simple cache)
const cache = new Map<string, { ts: number; data: unknown }>()
const TTL_MS = 60_000

function keyFor(path: string, params: Record<string, unknown>) {
  return `${path}?${Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&')}`
}

async function httpGetCached<T>(path: string, params: Record<string, unknown> = {}, opts: { signal?: AbortSignal } = {}) {
  const key = keyFor(path, params)
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data as T
  const data = await httpGet<T>(path, params, opts)
  cache.set(key, { ts: Date.now(), data })
  return data
}

// Use httpGetCached for getTrending/getFeatured
export async function getTrending() { return httpGetCached('/trending/movie/week') }
export async function getFeatured() { return httpGetCached('/movie/top_rated') }
```

### 4) Responsive images with srcset and lazy loading
Leverage TMDB’s multiple widths and allow the browser to choose the best size for the viewport. Add `decoding="async"` where appropriate.
```vue
<!-- Example in MovieCard.vue -->
<img
  v-if="movie.poster_path"
  :src="`https://image.tmdb.org/t/p/w300${movie.poster_path}`"
  :srcset="`
    https://image.tmdb.org/t/p/w200${movie.poster_path} 200w,
    https://image.tmdb.org/t/p/w300${movie.poster_path} 300w,
    https://image.tmdb.org/t/p/w500${movie.poster_path} 500w
  `"
  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
  :alt="movie.title"
  class="absolute inset-0 h-full w-full object-cover fade-in"
  loading="lazy"
  decoding="async"
/>
```
Apply similarly to `FeaturedCarousel.vue` and `YourMoviesPanel.vue`.

### 5) Supabase query optimization and pagination
Minimize columns selected and page results to reduce payloads and rendering.
```ts
// src/stores/movies.ts (load with selected columns + pagination)
const PAGE_SIZE = 20
const columns = 'id,user_id,title,tmdb_id,poster_path,created_at'
const from = 0
const to = PAGE_SIZE - 1

const { data, error, count } = await supabase
  .from('movies')
  .select(columns, { count: 'exact' })
  .eq('user_id', session.user.id)
  .order('created_at', { ascending: false })
  .range(from, to)
```
Expose a simple “Load more” that increments the range. For removal/add, keep optimistic updates and rely on realtime to sync.

### 6) Bundle analysis and vendor splitting
Use a visualizer to identify heavy modules and opportunities to reduce your initial JS.
```bash
# dev dependency
npm i -D rollup-plugin-visualizer
```
```ts
// vite.config.ts (example)
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  build: {
    rollupOptions: {
      plugins: [visualizer({ filename: 'dist/stats.html', open: true, gzipSize: true, brotliSize: true })],
    },
  },
})
```
Inspect `dist/stats.html` after a build and consider:
- Further async component splits
- Removing unused libs
- Ensuring tree-shaking works (use ESM, avoid deep dynamic requires)

### 7) Tailwind purge accuracy and safelisting
The current `content` globs look correct:
- `tailwind.config.js` → `content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}']`

If you rely on dynamic class names (computed strings), Tailwind may not detect them. Prefer explicit class strings. If dynamic usage is unavoidable, add a safelist:
```js
// tailwind.config.js
export default {
  // ...
  safelist: [
    // Examples: ensure these never get purged if built dynamically
    'pt-[150%]',
    'fade-in',
    'skeleton',
  ],
}
```

### 8) Capture Web Vitals to measure impact
Log or send Web Vitals to your analytics backend to verify improvements.
```bash
npm i web-vitals
```
```ts
// src/main.ts (at the end, for basic logging)
import { onCLS, onINP, onLCP } from 'web-vitals/attribution'

onCLS(console.log)
onINP(console.log)
onLCP(console.log)
// In production, send to your analytics endpoint instead of console.log
```
Track how CLS drops with aspect placeholders and how LCP improves with code-splitting and responsive images.

## Verification Checklist and Metrics to Watch
Before and after implementing each optimization, verify in CI or locally using Lighthouse, WebPageTest, or Chrome DevTools Performance panel. Aim to measure both cold and warm loads.

- Largest Contentful Paint (LCP): Target under ~2.5s on mid-tier mobile. Skeletons don’t change LCP directly, but route/component lazy-loading and responsive images do.
- Cumulative Layout Shift (CLS): Target < 0.1. The 2:3 aspect wrappers and reserving image space are critical here.
- Interaction to Next Paint (INP): Target < 200ms. Debouncing search and cancelling stale requests improve responsiveness.
- Total Blocking Time (TBT): Reduce long tasks. Avoid unnecessary re-renders and keep initial JS small via code-splitting.
- JavaScript bundle size: Track initial route JS and vendor chunk size. Use the visualizer to identify opportunities.
- Image bytes transferred: Validate `srcset` picks appropriate widths across devices.
- Number of network requests during search: Confirm that cancellation prevents piling up stale requests.
- Supabase query size and latency: Confirm limited columns and pagination reduce payloads and improve render speed.

## Next Steps Checklist
- Add AbortController-based cancellation to TMDB search and in-flight deduping.
- Introduce in-memory caching (short TTL) for trending and featured endpoints.
- Update poster images to use `srcset` and `sizes` with `decoding="async"` where applicable.
- Paginate and trim columns for Supabase queries; add optional “Load more.”
- Convert heavy components to async (e.g., FeaturedCarousel) to reduce initial payload.
- Add bundle visualizer; document and action any obvious heavy modules.
- Review Tailwind usage for dynamic classes; add safelist entries if necessary.
- Wire up Web Vitals logging and track CLS/LCP/INP/TBT across deployments.

## Notes on Environment and Build
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_TMDB_API_KEY`
- The strict Content Security Policy already whitelists TMDB and Supabase endpoints. If you introduce analytics for Web Vitals, update CSP accordingly.
