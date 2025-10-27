import './assets/tailwind.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useSessionStore } from './stores/session'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize auth session listener
const sessionStore = useSessionStore()
sessionStore.init()

app.mount('#app')
