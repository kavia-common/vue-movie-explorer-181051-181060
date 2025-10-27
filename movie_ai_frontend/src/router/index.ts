import { createRouter, createWebHistory } from 'vue-router'

const LandingView = () => import('../views/LandingView.vue')
const AppShell = () => import('../views/AppShell.vue')
const NotFound = () => import('../views/NotFound.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: LandingView },
    { path: '/app', name: 'app', component: AppShell },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  ],
})

export default router
