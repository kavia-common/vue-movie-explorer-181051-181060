<script setup lang="ts">
import type { TMDBMovie } from '@/types/movie'
import { useMoviesStore } from '@/stores/movies'
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'

const props = defineProps<{
  movie: TMDBMovie
}>()

const moviesStore = useMoviesStore()
const session = useSessionStore()

const isSaved = computed(() => moviesStore.isSaved(props.movie.id))
const canSave = computed(() => !!session.user && !isSaved.value)

async function onSave() {
  if (!session.user) return
  await moviesStore.addFromTmdb(props.movie)
}

async function onRemove() {
  await moviesStore.removeByTmdbId(props.movie.id)
}
</script>

<template>
  <div
    class="group rounded-xl bg-white/80 border border-purple-200/60 shadow-soft overflow-hidden"
  >
    <img
      v-if="movie.poster_path"
      :src="`https://image.tmdb.org/t/p/w342${movie.poster_path}`"
      :alt="movie.title"
      class="h-64 w-full object-cover transition-transform group-hover:scale-[1.02]"
      loading="lazy"
    />
    <div class="p-3">
      <h3 class="line-clamp-2 text-sm font-semibold text-purple-900">{{ movie.title }}</h3>
      <div class="mt-2 flex items-center justify-between">
        <button
          v-if="canSave"
          class="rounded-lg bg-primary px-3 py-1.5 text-xs text-white focus-ring"
          @click="onSave"
        >
          Save
        </button>
        <button
          v-else-if="isSaved"
          class="rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs text-purple-900 focus-ring"
          @click="onRemove"
        >
          Remove
        </button>
        <span class="text-xs text-secondary">{{ movie.release_date?.slice(0, 4) }}</span>
      </div>
    </div>
  </div>
</template>
