<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getFeatured } from '@/services/tmdb'
import type { TMDBMovie } from '@/types/movie'

const featured = ref<TMDBMovie[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const data = await getFeatured()
    featured.value = (data.results || []).slice(0, 12)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section aria-labelledby="featured-heading" class="mt-2" :aria-busy="loading ? 'true' : 'false'">
    <div class="flex items-center justify-between">
      <h2 id="featured-heading" class="text-xl font-semibold text-purple-900">Featured</h2>
      <span v-if="loading" class="text-sm text-secondary" role="status" aria-live="polite">Loading…</span>
    </div>
    <div class="mt-4 overflow-x-auto">
      <ul class="flex gap-4" role="list">
        <!-- Show skeleton cards while loading -->
        <template v-if="loading">
          <li v-for="i in 8" :key="`sk-${i}`" class="min-w-[160px]">
            <div class="rounded-xl bg-white/80 border border-purple-200/60 shadow-soft overflow-hidden">
              <div class="relative w-full pt-[150%]">
                <div class="absolute inset-0 skeleton" />
              </div>
              <div class="p-3">
                <div class="h-4 w-3/4 skeleton rounded-md"></div>
                <div class="mt-2 h-3 w-1/3 skeleton rounded-md"></div>
              </div>
            </div>
          </li>
        </template>

        <template v-else>
          <li v-for="m in featured" :key="m.id" class="min-w-[160px]">
            <div class="relative rounded-xl bg-white/70 shadow-soft border border-purple-200/60 overflow-hidden">
              <!-- Reserve aspect and fade-in -->
              <div class="relative w-full pt-[150%]">
                <img
                  v-if="m.poster_path"
                  :src="`https://image.tmdb.org/t/p/w342${m.poster_path}`"
                  :alt="m.title"
                  class="absolute inset-0 h-full w-full object-cover fade-in"
                  loading="lazy"
                />
                <div v-else class="absolute inset-0 skeleton"></div>
              </div>
              <div class="p-3">
                <h3 class="line-clamp-2 text-sm font-medium text-purple-900">{{ m.title }}</h3>
                <p class="mt-1 text-xs text-secondary">{{ m.release_date }}</p>
              </div>
            </div>
          </li>
        </template>
      </ul>
    </div>
  </section>
</template>
