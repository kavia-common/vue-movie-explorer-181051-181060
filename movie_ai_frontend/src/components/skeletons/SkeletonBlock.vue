<script setup lang="ts">
/**
 * PUBLIC_INTERFACE
 * SkeletonBlock: Reusable shimmering rectangle for placeholder UI.
 * - width/height accept CSS sizes (e.g., '100%', '2rem', '200px').
 * - rounded controls corner radius (default: true for rounded-xl).
 * - aria-hidden set to true as it conveys no content by itself.
 */
const props = withDefaults(
  defineProps<{
    width?: string
    height?: string
    rounded?: boolean
    class?: string
  }>(),
  {
    rounded: true,
  },
)
</script>

<template>
  <div
    class="skeleton"
    :class="[rounded ? 'rounded-xl' : '', props.class]"
    :style="{ width: width, height: height }"
    role="presentation"
    aria-hidden="true"
  />
</template>
