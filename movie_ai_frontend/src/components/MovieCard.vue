<script setup lang="ts">
import type { TMDBMovie } from '@/types/movie'
import { useMoviesStore } from '@/stores/movies'
import { computed, ref } from 'vue'
import { useSessionStore } from '@/stores/session'

const props = defineProps<{
  movie: TMDBMovie
}>()

const moviesStore = useMoviesStore()
const session = useSessionStore()

const isSaved = computed(() => moviesStore.isSaved(props.movie.id))
const saving = ref(false)
const errorMsg = ref<string | null>(null)

const canShowSave = computed(() => !!session.user)
const isDisabled = computed(() => saving.value || isSaved.value)

async function onSave() {
  if (!session.user || isSaved.value) return
  saving.value = true
  errorMsg.value = null
  try {
    // Prefer the public alias; internally maps to addFromTmdb
    await moviesStore.addMovie(props.movie)
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to save movie.'
  } finally {
    saving.value = false
  }
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
      <div class="mt-2 flex items-center justify-between gap-2">
        <template v-if="canShowSave">
          <button
            :disabled="isDisabled"
            class="rounded-lg px-3 py-1.5 text-xs focus-ring transition-colors"
            :class="[
              isDisabled
                ? 'cursor-not-allowed border border-purple-200 bg-white text-secondary'
                : 'bg-primary text-white hover:opacity-95'
            ]"
            @click="onSave"
            aria-live="polite"
          >
            <span v-if="saving">Saving…</span>
            <span v-else-if="isSaved">Saved</span>
            <span v-else>Save</span>
          </button>
        </template>
        <span class="ml-auto text-xs text-secondary">{{ movie.release_date?.slice(0, 4) }}</span>
      </div>
      <p v-if="errorMsg" class="mt-2 text-xs text-error">
        {{ errorMsg }}
      </p>
    </div>
  </div>
</template>
