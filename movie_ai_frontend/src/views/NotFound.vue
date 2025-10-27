<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background px-6">
    <div class="text-center">
      <h1 class="text-6xl font-extrabold text-primary">404</h1>
      <p class="mt-4 text-secondary">The page you’re looking for doesn’t exist.</p>
      <button class="mt-8 rounded-xl bg-primary px-5 py-3 text-white shadow-soft focus-ring" @click="router.push('/')">
        Go Home
      </button>
    </div>
  </div>
</template>
