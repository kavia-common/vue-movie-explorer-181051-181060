<script setup lang="ts">
import { ref, watch } from 'vue'

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
  <div class="relative mt-2">
    <label for="search" class="sr-only">Search movies</label>
    <input
      id="search"
      v-model="q"
      type="text"
      placeholder="Search movies..."
      class="w-full rounded-xl border border-purple-300/60 bg-white/80 px-4 py-3 shadow-soft placeholder:text-secondary focus-ring"
      inputmode="search"
      autocomplete="off"
    />
    <span class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-secondary">⌘K</span>
  </div>
</template>
