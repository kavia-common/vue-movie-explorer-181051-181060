<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMoviesStore } from '@/stores/movies'

const store = useMoviesStore()
const { movies, loading } = storeToRefs(store)
</script>

<template>
  <section aria-labelledby="your-movies-heading" class="rounded-xl bg-white/70 p-5 shadow-soft border border-purple-200/60">
    <div class="flex items-center justify-between">
      <h2 id="your-movies-heading" class="text-xl font-semibold text-purple-900">Your Movies</h2>
      <span v-if="loading" class="text-sm text-secondary">Loading…</span>
    </div>

    <div v-if="movies.length === 0 && !loading" class="mt-3 text-sm text-secondary">
      No movies saved yet. Search and click “Save” to add some.
    </div>

    <ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="list">
      <li v-for="m in movies" :key="m.id" class="rounded-lg border border-purple-200/60 bg-white/80">
        <img
          v-if="m.poster_path"
          :src="`https://image.tmdb.org/t/p/w342${m.poster_path}`"
          :alt="m.title"
          class="h-44 w-full rounded-t-lg object-cover"
          loading="lazy"
        />
        <div class="p-2">
          <div class="line-clamp-2 text-xs font-medium text-purple-900">{{ m.title }}</div>
          <button
            class="mt-2 w-full rounded-md border border-purple-300 bg-white px-2 py-1 text-xs text-purple-900 focus-ring"
            @click.prevent="store.remove(m.id as string)"
          >
            Remove
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
