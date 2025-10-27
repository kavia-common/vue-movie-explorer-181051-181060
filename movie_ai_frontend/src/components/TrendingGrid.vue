<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import MovieCard from './MovieCard.vue'
import { getTrending } from '@/services/tmdb'
import type { TMDBMovie } from '@/types/movie'

const props = defineProps<{
  searchResults?: TMDBMovie[]
  showSearch?: boolean
  loading?: boolean
}>()

const trending = ref<TMDBMovie[]>([])
const isLoading = ref(false)

onMounted(async () => {
  if (props.showSearch) return
  isLoading.value = true
  try {
    const data = await getTrending()
    trending.value = data.results || []
  } finally {
    isLoading.value = false
  }
})

const items = computed(() => (props.showSearch ? props.searchResults ?? [] : trending.value))
</script>

<template>
  <section class="mt-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-purple-900">
        {{ showSearch ? 'Results' : 'Trending This Week' }}
      </h2>
      <span v-if="loading || isLoading" class="text-sm text-secondary">Loading…</span>
    </div>

    <div
      class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6"
      role="list"
    >
      <MovieCard v-for="m in items" :key="m.id" :movie="m" />
    </div>
  </section>
</template>
