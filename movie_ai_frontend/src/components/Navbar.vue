<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import AuthButton from './AuthButton.vue'

const { transparent = false } = defineProps<{
  transparent?: boolean
}>()

const session = useSessionStore()
const isAuthed = computed(() => !!session.user)
</script>

<template>
  <header
    :class="[
      'fixed top-0 inset-x-0 z-40',
      transparent ? 'bg-transparent' : 'bg-white/80 backdrop-blur border-b border-purple-200/60'
    ]"
    role="banner"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav class="flex h-16 items-center justify-between" aria-label="Primary navigation">
        <a href="/" class="flex items-center gap-2 rounded-lg focus-ring">
          <span class="inline-block h-8 w-8 rounded-xl bg-primary" aria-hidden="true"></span>
          <span class="text-lg font-semibold text-purple-900">Movie Explorer</span>
        </a>
        <div class="flex items-center gap-3">
          <span v-if="isAuthed" class="hidden sm:block text-sm text-secondary">Welcome</span>
          <AuthButton />
        </div>
      </nav>
    </div>
  </header>
</template>
