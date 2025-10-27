<script setup lang="ts">
import SkeletonCard from './SkeletonCard.vue'

/**
 * PUBLIC_INTERFACE
 * SkeletonGrid: Renders a configurable grid of SkeletonCard placeholders.
 * - count: number of skeleton cards to render.
 * - gridClass: tailwind classes for the grid container.
 */
withDefaults(
  defineProps<{
    count?: number
    gridClass?: string
    compact?: boolean
  }>(),
  {
    count: 12,
    gridClass:
      'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6',
    compact: false,
  },
)
</script>

<template>
  <div :class="gridClass" role="status" aria-live="polite" aria-label="Loading items">
    <SkeletonCard v-for="i in count" :key="i" :compact="compact" />
    <span class="sr-only">Loading…</span>
  </div>
</template>
