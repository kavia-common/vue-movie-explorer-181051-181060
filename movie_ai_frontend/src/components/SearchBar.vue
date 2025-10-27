<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'search', value: string): void
}>()

const q = ref('')
const debounceMs = 500
let timer: ReturnType<typeof setTimeout> | undefined

watch(q, (val) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => emit('search', val.trim()), debounceMs)
})
</script>

<template>
  <div class="relative mt-2" :aria-busy="props.loading ? 'true' : 'false'">
    <label for="search" class="sr-only">Search movies</label>
    <input
      id="search"
      v-model="q"
      type="text"
      placeholder="Search movies..."
      class="w-full rounded-xl border border-purple-300/60 bg-white/80 px-4 py-3 shadow-soft placeholder:text-secondary focus-ring"
      inputmode="search"
      autocomplete="off"
      :aria-label="props.loading ? 'Searching movies' : 'Search movies'"
    />
    <!-- Right adornment: spinner while loading, otherwise shortcut hint -->
    <div class="absolute inset-y-0 right-4 flex items-center">
      <template v-if="props.loading">
        <span
          class="h-4 w-4 rounded-full border-2 border-primary/70 border-t-transparent animate-spin"
          aria-hidden="true"
        />
        <span class="sr-only" role="status" aria-live="polite">Searching…</span>
      </template>
      <span v-else class="pointer-events-none text-secondary">⌘K</span>
    </div>
  </div>
</template>
