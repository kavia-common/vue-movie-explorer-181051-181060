<script setup lang="ts">
import { useSessionStore } from '@/stores/session'
const session = useSessionStore()

function signIn() {
  session.signInWithGoogle()
}

function signOut() {
  session.signOut()
}
</script>

<template>
  <button
    v-if="!session.user"
    class="rounded-xl bg-primary px-4 py-2 text-white shadow-soft hover:opacity-95 focus-ring"
    @click="signIn"
    aria-label="Sign in with Google"
  >
    Sign in with Google
  </button>

  <button
    v-else
    class="rounded-xl border border-purple-300 px-4 py-2 text-purple-900 bg-white/70 hover:bg-white focus-ring"
    @click="signOut"
    aria-label="Sign out"
  >
    Sign out
  </button>
</template>
