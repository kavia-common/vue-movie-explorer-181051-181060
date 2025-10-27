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
  <section aria-labelledby="featured-heading" class="mt-2">
    <div class="flex items-center justify-between">
      <h2 id="featured-heading" class="text-xl font-semibold text-purple-900">Featured</h2>
      <span v-if="loading" class="text-sm text-secondary">Loading…</span>
    </div>
    <div class="mt-4 overflow-x-auto">
      <ul class="flex gap-4" role="list">
        <li v-for="m in featured" :key="m.id" class="min-w-[160px]">
          <div class="relative rounded-xl bg-white/70 shadow-soft border border-purple-200/60">
            <img
              v-if="m.poster_path"
              :src="`https://image.tmdb.org/t/p/w342${m.poster_path}`"
              :alt="m.title"
              class="h-56 w-full rounded-t-xl object-cover"
              loading="lazy"
            />
            <div class="p-3">
              <h3 class="line-clamp-2 text-sm font-medium text-purple-900">{{ m.title }}</h3>
              <p class="mt-1 text-xs text-secondary">{{ m.release_date }}</p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
