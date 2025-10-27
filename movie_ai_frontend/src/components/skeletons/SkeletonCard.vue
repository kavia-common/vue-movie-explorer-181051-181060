<script setup lang="ts">
/**
 * PUBLIC_INTERFACE
 * SkeletonCard: Placeholder for a movie card with poster (2:3) and text lines.
 * - compact: slightly smaller layout
 */
withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)
</script>

<template>
  <div class="rounded-xl bg-white/80 border border-purple-200/60 shadow-soft overflow-hidden">
    <!-- Poster 2:3 aspect ratio -->
    <div class="relative w-full pt-[150%]">
      <div class="absolute inset-0 skeleton" />
    </div>
    <div class="p-3">
      <div class="h-4 w-3/4 skeleton rounded-md"></div>
      <div class="mt-2 h-3 w-1/3 skeleton rounded-md"></div>
    </div>
  </div>
</template>
