<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import SearchBar from '@/components/SearchBar.vue'
import TrendingGrid from '@/components/TrendingGrid.vue'
import FeaturedCarousel from '@/components/FeaturedCarousel.vue'
import YourMoviesPanel from '@/components/YourMoviesPanel.vue'
import { ref, computed } from 'vue'
import { searchMovies } from '@/services/tmdb'
import type { TMDBMovie } from '@/types/movie'
import { useSessionStore } from '@/stores/session'
import SkeletonBlock from '@/components/skeletons/SkeletonBlock.vue'
import SkeletonGrid from '@/components/skeletons/SkeletonGrid.vue'

const session = useSessionStore()

const query = ref('')
const searching = ref(false)
const results = ref<TMDBMovie[]>([])

const appBootLoading = computed(() => !session.initialized || session.loading)

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

    <main
      class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-10"
      :aria-busy="searching || appBootLoading ? 'true' : 'false'"
    >
      <template v-if="appBootLoading">
        <!-- Shell boot skeletons -->
        <SkeletonBlock height="3rem" class="w-full" />
        <section class="mt-8 space-y-8">
          <div>
            <div class="flex items-center justify-between">
              <SkeletonBlock height="1.5rem" class="w-40" />
            </div>
            <div class="mt-4">
              <div class="flex gap-4 overflow-x-auto">
                <div v-for="i in 8" :key="i" class="min-w-[160px]">
                  <div class="rounded-xl bg-white/80 border border-purple-200/60 shadow-soft overflow-hidden">
                    <div class="relative w-full pt-[150%]">
                      <div class="absolute inset-0 skeleton"></div>
                    </div>
                    <div class="p-3">
                      <div class="h-4 w-3/4 skeleton rounded-md"></div>
                      <div class="mt-2 h-3 w-1/3 skeleton rounded-md"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SkeletonGrid :count="12" />

          <aside class="mt-10">
            <div class="rounded-xl bg-white/70 p-5 shadow-soft border border-purple-200/60">
              <div class="flex items-center justify-between">
                <SkeletonBlock height="1.5rem" class="w-40" />
              </div>
              <div class="mt-4">
                <SkeletonGrid :count="8" :gridClass="'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'" :compact="true" />
              </div>
            </div>
          </aside>
        </section>
      </template>

      <template v-else>
        <SearchBar @search="onSearch" :loading="searching" />

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
      </template>
    </main>
  </div>
</template>
