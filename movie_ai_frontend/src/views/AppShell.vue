<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import SearchBar from '@/components/SearchBar.vue'
import TrendingGrid from '@/components/TrendingGrid.vue'
import FeaturedCarousel from '@/components/FeaturedCarousel.vue'
import YourMoviesPanel from '@/components/YourMoviesPanel.vue'
import { ref } from 'vue'
import { searchMovies } from '@/services/tmdb'
import type { TMDBMovie } from '@/types/movie'

const query = ref('')
const searching = ref(false)
const results = ref<TMDBMovie[]>([])

async function onSearch(q: string) {
  query.value = q
  if (!q) {
    results.value = []
    searching.value = false
    return
  }
  searching.value = true
  try {
    const res = await searchMovies(q)
    results.value = res.results || []
  } finally {
    searching.value = false
  }
}
</script>

<template>
  <div class="min-h-screen">
    <Navbar :transparent="false" />

    <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-10">
      <SearchBar @search="onSearch" />

      <section class="mt-8 space-y-8">
        <FeaturedCarousel />

        <div v-if="query && !searching" class="mt-4">
          <h2 class="text-xl font-semibold text-purple-900">Search Results</h2>
        </div>
        <TrendingGrid :searchResults="results" :showSearch="!!query" :loading="searching" />
      </section>

      <aside class="mt-10">
        <YourMoviesPanel />
      </aside>
    </main>
  </div>
</template>
