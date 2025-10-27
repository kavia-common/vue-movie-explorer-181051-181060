<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import AuthButton from '@/components/AuthButton.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const goToApp = () => router.push('/app')
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <Navbar :transparent="true" />

    <section class="relative pt-28">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl lg:mx-0">
          <h1 class="text-4xl font-extrabold tracking-tight text-purple-900 sm:text-6xl">
            Explore movies with elegance and intelligence
          </h1>
          <p class="mt-6 text-lg leading-8 text-gray-700">
            Sign in with Google, save your favorites in real-time, and discover trending and featured
            movies powered by TMDB — all within a refined Royal Purple experience.
          </p>
          <div class="mt-10 flex items-center gap-x-4">
            <button
              class="rounded-xl bg-primary px-5 py-3 text-white shadow-soft hover:opacity-95 focus-ring"
              @click="goToApp"
            >
              Open the App
            </button>
            <AuthButton />
          </div>
        </div>
        <div class="mt-16 flow-root sm:mt-24">
          <div class="-m-2 rounded-2xl p-2 ring-1 ring-purple-300/40 backdrop-blur-md bg-white/40">
            <div
              class="rounded-xl bg-gradient-to-br from-purple-100 to-purple-300 p-12 text-center text-purple-900"
              role="img"
              aria-label="Abstract royal purple illustration"
            >
              <div class="text-2xl font-semibold">Royal Purple Aesthetic</div>
              <div class="mt-2 text-sm text-purple-800/80">Elegant. Accessible. Responsive.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
